export type InterviewRole = "software-engineer" | "product-manager" | "data-scientist";

export type CandidateProfile = {
  name: string;
  headline: string;
  skills: string[];
  experience: string[];
  education: string[];
  rawText: string;
  fileName: string;
};

export type Question = {
  id: string;
  text: string;
  competency: string;
  keywords: string[];
  isFollowUp?: boolean;
  source?: string;
};

export type DeliveryMetrics = {
  wordCount: number;
  durationSeconds: number;
  wordsPerMinute: number;
  fillerCount: number;
  fillerWords: string[];
  pauseCount: number;
  clarityLabel: string;
};

export type AnswerScore = {
  relevance: number;
  structure: number;
  specificity: number;
  communication: number;
  competency: number;
  overall: number;
  strengths: string[];
  improvements: string[];
  metrics: DeliveryMetrics;
};

export type InterviewAnswer = {
  question: Question;
  transcript: string;
  durationSeconds: number;
  pauses: number;
  score: AnswerScore;
};

export type InterviewReport = {
  overall: number;
  dimensions: {
    relevance: number;
    structure: number;
    specificity: number;
    communication: number;
    competency: number;
  };
  strengths: string[];
  improvements: string[];
  answers: InterviewAnswer[];
};

export type InterviewSession = {
  id: string;
  completedAt: string;
  role: InterviewRole;
  candidateName: string;
  overall: number;
  dimensions: InterviewReport["dimensions"];
  strengths: string[];
  improvements: string[];
  answerCount: number;
};
