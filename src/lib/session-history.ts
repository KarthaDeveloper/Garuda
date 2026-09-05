import type { InterviewReport, InterviewRole, InterviewSession } from "@/lib/types";

export const SESSION_HISTORY_KEY = "garuda:interview-history:v1";
const MAX_SESSIONS = 24;

type HistoryStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function browserStorage(): HistoryStorage | null {
  return typeof window === "undefined" ? null : window.localStorage;
}

function isSession(value: unknown): value is InterviewSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<InterviewSession>;
  return (
    typeof session.id === "string" &&
    typeof session.completedAt === "string" &&
    typeof session.candidateName === "string" &&
    typeof session.overall === "number" &&
    typeof session.answerCount === "number" &&
    ["software-engineer", "product-manager", "data-scientist"].includes(session.role || "") &&
    Boolean(session.dimensions)
  );
}

export function readSessionHistory(storage = browserStorage()): InterviewSession[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(SESSION_HISTORY_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSession).sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  } catch {
    return [];
  }
}

export function createSessionSummary(
  report: InterviewReport,
  candidateName: string,
  role: InterviewRole,
  completedAt = new Date(),
): InterviewSession {
  return {
    id: globalThis.crypto?.randomUUID?.() || `${completedAt.getTime()}-${report.overall}`,
    completedAt: completedAt.toISOString(),
    role,
    candidateName,
    overall: report.overall,
    dimensions: { ...report.dimensions },
    strengths: report.strengths.slice(0, 3),
    improvements: report.improvements.slice(0, 3),
    answerCount: report.answers.length,
  };
}

export function saveSessionSummary(session: InterviewSession, storage = browserStorage()) {
  if (!storage) return [];
  const history = [session, ...readSessionHistory(storage)]
    .filter((item, index, items) => items.findIndex(({ id }) => id === item.id) === index)
    .slice(0, MAX_SESSIONS);
  storage.setItem(SESSION_HISTORY_KEY, JSON.stringify(history));
  return history;
}

export function clearSessionHistory(storage = browserStorage()) {
  storage?.removeItem(SESSION_HISTORY_KEY);
}
