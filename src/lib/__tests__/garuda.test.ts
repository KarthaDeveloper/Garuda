import { describe, expect, it } from "vitest";
import { analyzeDelivery, createReport, scoreAnswer } from "@/lib/analytics";
import {
  createAdaptiveFollowUp,
  createQuestionSet,
  nextBaseQuestion,
} from "@/lib/interview-engine";
import { extractCandidateProfile, SAMPLE_RESUME } from "@/lib/resume-parser";
import {
  clearSessionHistory,
  createSessionSummary,
  readSessionHistory,
  saveSessionSummary,
} from "@/lib/session-history";

describe("resume extraction", () => {
  it("extracts candidate identity, skills, and evidence", () => {
    const profile = extractCandidateProfile(SAMPLE_RESUME, "sample.txt");
    expect(profile.name).toBe("Maya Rao");
    expect(profile.skills).toContain("TypeScript");
    expect(profile.skills).toContain("React");
    expect(profile.experience.some((line) => line.includes("38%"))).toBe(true);
  });
});

describe("interview engine", () => {
  const profile = extractCandidateProfile(SAMPLE_RESUME, "sample.txt");

  it("creates distinct resume-aware role questions", () => {
    const swe = createQuestionSet(profile, "software-engineer");
    const pm = createQuestionSet(profile, "product-manager");
    expect(swe).toHaveLength(5);
    expect(swe[0].source).toBe("Resume");
    expect(swe[1].text).not.toBe(pm[1].text);
  });

  it("probes vague answers and accepts specific measurable answers", () => {
    const question = createQuestionSet(profile, "software-engineer")[0];
    expect(createAdaptiveFollowUp("We worked on it and it went well.", question, 1)?.text).toContain(
      "concrete",
    );
    const strong =
      "In that project, I led the migration plan. I designed a staged rollout, tested each cohort, and reduced latency by 38%. The result was a lower abandonment rate.";
    expect(createAdaptiveFollowUp(strong, question, 1)).toBeNull();
  });

  it("moves to the next unanswered base question", () => {
    const questions = createQuestionSet(profile, "software-engineer");
    const first = {
      question: questions[0],
      transcript: "answer",
      durationSeconds: 30,
      pauses: 0,
      score: scoreAnswer("answer", questions[0], 30),
    };
    expect(nextBaseQuestion(questions, [first])?.id).toBe(questions[1].id);
  });
});

describe("local scoring", () => {
  const question = {
    id: "q1",
    text: "Tell me about impact.",
    competency: "Execution",
    keywords: ["customer", "impact", "result"],
  };

  it("calculates delivery metrics and penalizes filler-heavy speech", () => {
    const clean = analyzeDelivery(
      "I led the launch and improved customer conversion by 24 percent after testing the new flow.",
      12,
      1,
    );
    const filler = analyzeDelivery("Um I like basically did the thing you know actually.", 12, 0);
    expect(clean.fillerCount).toBe(0);
    expect(filler.fillerCount).toBeGreaterThan(3);
  });

  it("rewards specific, owned, measurable answers and creates a report", () => {
    const weak = scoreAnswer("We did a project and it was good.", question, 20);
    const strongText =
      "The customer conversion had fallen. I designed and tested a new flow, then led the launch. The result was a 24% improvement in conversion and we learned which segment had the highest impact.";
    const strong = scoreAnswer(strongText, question, 55, 2);
    expect(strong.overall).toBeGreaterThan(weak.overall);
    const report = createReport([
      { question, transcript: strongText, durationSeconds: 55, pauses: 2, score: strong },
    ]);
    expect(report.overall).toBe(strong.overall);
    expect(report.strengths.length).toBeGreaterThan(0);
  });
});

describe("session history", () => {
  it("persists report summaries without resume text or transcripts", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) || null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
    };
    const question = {
      id: "q1",
      text: "Tell me about impact.",
      competency: "Execution",
      keywords: ["impact"],
    };
    const transcript = "I led the release and improved customer activation by 22%.";
    const score = scoreAnswer(transcript, question, 30);
    const report = createReport([
      { question, transcript, durationSeconds: 30, pauses: 0, score },
    ]);

    saveSessionSummary(
      createSessionSummary(report, "Maya Rao", "product-manager", new Date("2026-09-05T12:00:00Z")),
      storage,
    );

    const history = readSessionHistory(storage);
    expect(history).toHaveLength(1);
    expect(history[0].overall).toBe(report.overall);
    expect(history[0].role).toBe("product-manager");
    expect(JSON.stringify(history)).not.toContain(transcript);
    clearSessionHistory(storage);
    expect(readSessionHistory(storage)).toEqual([]);
  });
});
