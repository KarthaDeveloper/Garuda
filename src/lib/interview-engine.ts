import type { CandidateProfile, InterviewAnswer, InterviewRole, Question } from "@/lib/types";

export const ROLE_META: Record<
  InterviewRole,
  { name: string; short: string; description: string; color: string }
> = {
  "software-engineer": {
    name: "Software Engineer",
    short: "SWE",
    description: "Systems, execution, trade-offs, and technical leadership",
    color: "bg-blue-50 text-blue-800 border-blue-200",
  },
  "product-manager": {
    name: "Product Manager",
    short: "PM",
    description: "Product sense, prioritisation, strategy, and influence",
    color: "bg-amber-50 text-amber-900 border-amber-200",
  },
  "data-scientist": {
    name: "Data Scientist",
    short: "DS",
    description: "Experimentation, modelling, metrics, and communication",
    color: "bg-emerald-50 text-emerald-900 border-emerald-200",
  },
};

const ROLE_QUESTIONS: Record<InterviewRole, Omit<Question, "id">[]> = {
  "software-engineer": [
    {
      text: "Tell me about a technically complex system you built. What made it difficult, and what trade-offs did you make?",
      competency: "Technical depth",
      keywords: ["architecture", "trade-off", "scale", "reliability", "latency"],
    },
    {
      text: "Describe a production incident you helped resolve. How did you diagnose it, communicate, and prevent recurrence?",
      competency: "Operational excellence",
      keywords: ["incident", "root cause", "monitoring", "prevention", "communication"],
    },
    {
      text: "How do you decide when to refactor a system versus continue shipping on the current design?",
      competency: "Engineering judgment",
      keywords: ["risk", "cost", "customer", "debt", "incremental"],
    },
    {
      text: "Tell me about a technical disagreement. How did you move the team toward a decision?",
      competency: "Collaboration",
      keywords: ["evidence", "listen", "alignment", "decision", "experiment"],
    },
    {
      text: "Design a notification service that can deliver millions of time-sensitive messages. Walk me through the interfaces and failure modes.",
      competency: "System design",
      keywords: ["queue", "idempotency", "retry", "partition", "observability"],
    },
  ],
  "product-manager": [
    {
      text: "Tell me about a product problem you chose to solve. How did you know it mattered?",
      competency: "Product sense",
      keywords: ["customer", "research", "problem", "evidence", "outcome"],
    },
    {
      text: "Describe a time you said no to an important stakeholder. How did you make and communicate the trade-off?",
      competency: "Prioritisation",
      keywords: ["strategy", "impact", "effort", "alignment", "trade-off"],
    },
    {
      text: "Walk me through a product launch that did not meet expectations. What did you learn and change?",
      competency: "Execution",
      keywords: ["launch", "metric", "learn", "iteration", "customer"],
    },
    {
      text: "How would you define success for a new AI interview practice product?",
      competency: "Metrics",
      keywords: ["north star", "retention", "activation", "quality", "guardrail"],
    },
    {
      text: "Your team has one quarter and three competing customer problems. How would you choose what to build?",
      competency: "Strategy",
      keywords: ["segment", "strategy", "impact", "confidence", "roadmap"],
    },
  ],
  "data-scientist": [
    {
      text: "Tell me about an analysis or model that changed a product decision. How did you establish trust in the result?",
      competency: "Applied impact",
      keywords: ["metric", "validation", "stakeholder", "decision", "impact"],
    },
    {
      text: "Design an experiment to evaluate a new onboarding flow. What are your primary metric and guardrails?",
      competency: "Experimentation",
      keywords: ["hypothesis", "randomization", "power", "guardrail", "significance"],
    },
    {
      text: "Describe a model that performed well offline but poorly in production. How would you investigate?",
      competency: "Modeling judgment",
      keywords: ["drift", "leakage", "distribution", "monitoring", "baseline"],
    },
    {
      text: "How do you explain an uncertain or counterintuitive result to a non-technical stakeholder?",
      competency: "Communication",
      keywords: ["uncertainty", "visualize", "decision", "assumption", "plain language"],
    },
    {
      text: "You inherit a dataset with missing values and unclear labels. What do you do before training anything?",
      competency: "Data quality",
      keywords: ["audit", "missing", "label", "bias", "baseline"],
    },
  ],
};

const hasNumber = (text: string) => /\b\d+(?:\.\d+)?%?\b/.test(text);
const hasExample = (text: string) =>
  /\b(when|example|project|situation|task|challenge|we|I led|I built|I created)\b/i.test(text);
const hasAction = (text: string) =>
  /\b(I|we)\s+(built|led|created|changed|tested|designed|implemented|prioritized|analysed|analyzed|decided)\b/i.test(
    text,
  );

export function createQuestionSet(profile: CandidateProfile, role: InterviewRole): Question[] {
  const questions = ROLE_QUESTIONS[role].map((question, index) => ({
    ...question,
    id: `${role}-${index + 1}`,
  }));
  const evidence = profile.experience[0] || profile.skills.slice(0, 2).join(" and ");
  if (evidence) {
    const compact = evidence.replace(/\s+/g, " ").replace(/[.!?]+$/, "").slice(0, 150);
    questions[0] = {
      ...questions[0],
      text: `Your resume says, “${compact}”. What was the hardest part, what did you personally own, and what changed because of your work?`,
      source: "Resume",
    };
  }
  return questions;
}

export function createAdaptiveFollowUp(
  answer: string,
  current: Question,
  sequence: number,
): Question | null {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  if (words.length < 25) {
    return {
      id: `${current.id}-follow-${sequence}`,
      text: "Let’s make that concrete. Can you walk me through one specific situation, your personal actions, and the result?",
      competency: current.competency,
      keywords: current.keywords,
      isFollowUp: true,
      source: "Adaptive probe: specificity",
    };
  }
  if (!hasExample(answer) || !hasAction(answer)) {
    return {
      id: `${current.id}-follow-${sequence}`,
      text: "What did you personally do—not just the team—and what constraint shaped your decision?",
      competency: current.competency,
      keywords: current.keywords,
      isFollowUp: true,
      source: "Adaptive probe: ownership",
    };
  }
  if (!hasNumber(answer)) {
    return {
      id: `${current.id}-follow-${sequence}`,
      text: "How did you measure whether that worked? Give me the clearest before-and-after signal you had.",
      competency: current.competency,
      keywords: current.keywords,
      isFollowUp: true,
      source: "Adaptive probe: impact",
    };
  }
  return null;
}

type LanguageModelSession = { prompt: (input: string) => Promise<string>; destroy?: () => void };
type LanguageModelApi = {
  availability?: () => Promise<string>;
  create: (options?: { systemPrompt?: string }) => Promise<LanguageModelSession>;
};

declare global {
  interface Window {
    LanguageModel?: LanguageModelApi;
    ai?: { languageModel?: LanguageModelApi };
  }
}

export async function enhanceFollowUpLocally(
  fallback: Question,
  answer: string,
  role: InterviewRole,
): Promise<{ question: Question; model: "on-device" | "fallback" }> {
  const api = window.LanguageModel || window.ai?.languageModel;
  if (!api) return { question: fallback, model: "fallback" };
  const fallbackResult = { question: fallback, model: "fallback" as const };
  const enhancement = async () => {
    let session: LanguageModelSession | undefined;
    try {
      const availability = await api.availability?.();
      if (
        availability &&
        !["available", "readily"].includes(availability)
      ) {
        return fallbackResult;
      }
      session = await api.create({
        systemPrompt:
          "You are a concise mock interviewer. Return one probing follow-up question only. Never evaluate or praise.",
      });
      const text = await session.prompt(
        `Role: ${ROLE_META[role].name}\nCandidate answer: ${answer.slice(0, 1500)}\nRequired probe: ${fallback.text}`,
      );
      const clean = text.trim().replace(/^["']|["']$/g, "").slice(0, 260);
      if (clean.length > 15) {
        return {
          question: { ...fallback, text: clean, source: "On-device model" },
          model: "on-device" as const,
        };
      }
    } catch {
      // Required fallback keeps the interview available when the local model fails.
    } finally {
      session?.destroy?.();
    }
    return fallbackResult;
  };

  return Promise.race([
    enhancement(),
    new Promise<typeof fallbackResult>((resolve) => {
      window.setTimeout(() => resolve(fallbackResult), 2200);
    }),
  ]);
}

export function nextBaseQuestion(questions: Question[], answers: InterviewAnswer[]) {
  const answeredBaseIds = new Set(
    answers.filter((answer) => !answer.question.isFollowUp).map((answer) => answer.question.id),
  );
  return questions.find((question) => !answeredBaseIds.has(question.id)) || null;
}
