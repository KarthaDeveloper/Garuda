import type {
  AnswerScore,
  DeliveryMetrics,
  InterviewAnswer,
  InterviewReport,
  Question,
} from "@/lib/types";

const FILLERS = ["um", "uh", "like", "you know", "basically", "actually", "literally", "sort of", "kind of"];
const STAR_WORDS = ["situation", "context", "task", "challenge", "action", "result", "outcome", "learned"];

const clamp = (value: number, min = 0, max = 100) => Math.round(Math.min(max, Math.max(min, value)));

export function analyzeDelivery(
  transcript: string,
  durationSeconds: number,
  pauseCount = 0,
): DeliveryMetrics {
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const lower = transcript.toLowerCase();
  const found = FILLERS.flatMap((filler) => {
    const matches = lower.match(new RegExp(`\\b${filler.replace(" ", "\\s+")}\\b`, "g"));
    return Array(matches?.length || 0).fill(filler);
  });
  const effectiveDuration = Math.max(durationSeconds, Math.round(words.length / 2.1));
  const wpm = words.length ? Math.round((words.length / effectiveDuration) * 60) : 0;
  const clarityLabel =
    found.length <= 2 && wpm >= 105 && wpm <= 175
      ? "Clear and measured"
      : wpm > 185
        ? "Fast—add deliberate pauses"
        : wpm > 0 && wpm < 90
          ? "Slow—tighten the setup"
          : found.length > 4
            ? "Reduce filler words"
            : "Steady delivery";

  return {
    wordCount: words.length,
    durationSeconds: effectiveDuration,
    wordsPerMinute: wpm,
    fillerCount: found.length,
    fillerWords: [...new Set(found)],
    pauseCount,
    clarityLabel,
  };
}

export function scoreAnswer(
  transcript: string,
  question: Question,
  durationSeconds: number,
  pauseCount = 0,
): AnswerScore {
  const lower = transcript.toLowerCase();
  const words = transcript.trim().split(/\s+/).filter(Boolean);
  const metrics = analyzeDelivery(transcript, durationSeconds, pauseCount);
  const keywordHits = question.keywords.filter((keyword) => lower.includes(keyword.toLowerCase())).length;
  const starHits = STAR_WORDS.filter((word) => lower.includes(word)).length;
  const hasMetric = /\b\d+(?:\.\d+)?%?\b/.test(transcript);
  const ownership = /\bI\s+(led|built|created|designed|decided|analysed|analyzed|implemented|changed|tested|owned)\b/i.test(
    transcript,
  );
  const result = /\b(result|outcome|impact|improved|reduced|grew|increased|decreased|learned)\b/i.test(transcript);

  const relevance = clamp(42 + keywordHits * 12 + Math.min(words.length, 80) * 0.25);
  const structure = clamp(38 + starHits * 8 + (ownership ? 13 : 0) + (result ? 14 : 0));
  const specificity = clamp(35 + (hasMetric ? 25 : 0) + (ownership ? 18 : 0) + Math.min(words.length, 100) * 0.18);
  const communication = clamp(
    70 -
      Math.max(0, metrics.fillerCount - 2) * 5 -
      (metrics.wordsPerMinute > 190 ? 15 : 0) -
      (metrics.wordsPerMinute < 80 ? 10 : 0) +
      (words.length >= 45 ? 8 : 0),
  );
  const competency = clamp(40 + keywordHits * 13 + (hasMetric ? 10 : 0) + (result ? 10 : 0));
  const overall = clamp(
    relevance * 0.22 + structure * 0.18 + specificity * 0.22 + communication * 0.16 + competency * 0.22,
  );

  const strengths: string[] = [];
  const improvements: string[] = [];
  if (ownership) strengths.push("Clear personal ownership");
  else improvements.push("Separate your contribution from the team’s work");
  if (hasMetric) strengths.push("Impact supported with a measurable signal");
  else improvements.push("Add a before-and-after metric or observable outcome");
  if (result) strengths.push("Closed the story with an outcome");
  else improvements.push("Close with the result and what you learned");
  if (starHits >= 2) strengths.push("Answer had an easy-to-follow structure");
  else improvements.push("Use context → action → result to make the story easier to follow");
  if (metrics.fillerCount > 4) improvements.push(`Reduce fillers such as “${metrics.fillerWords.slice(0, 2).join("” and “")}”`);
  if (words.length < 35) improvements.push("Use one concrete example instead of a high-level summary");

  return {
    relevance,
    structure,
    specificity,
    communication,
    competency,
    overall,
    strengths: strengths.slice(0, 3),
    improvements: improvements.slice(0, 3),
    metrics,
  };
}

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;

export function createReport(answers: InterviewAnswer[]): InterviewReport {
  const dimensions = {
    relevance: average(answers.map((answer) => answer.score.relevance)),
    structure: average(answers.map((answer) => answer.score.structure)),
    specificity: average(answers.map((answer) => answer.score.specificity)),
    communication: average(answers.map((answer) => answer.score.communication)),
    competency: average(answers.map((answer) => answer.score.competency)),
  };
  const strengths = [...new Set(answers.flatMap((answer) => answer.score.strengths))].slice(0, 4);
  const improvements = [...new Set(answers.flatMap((answer) => answer.score.improvements))].slice(0, 4);
  return {
    overall: average(answers.map((answer) => answer.score.overall)),
    dimensions,
    strengths: strengths.length ? strengths : ["You completed the full interview loop"],
    improvements: improvements.length ? improvements : ["Practice once more with a different example"],
    answers,
  };
}
