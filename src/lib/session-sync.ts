import type { InterviewSession } from "@/lib/types";
import { getSupabaseClient } from "@/lib/supabase";

type SessionRow = {
  id: string;
  user_id: string;
  completed_at: string;
  role: InterviewSession["role"];
  candidate_name: string;
  overall: number;
  dimensions: InterviewSession["dimensions"];
  strengths: string[];
  improvements: string[];
  answer_count: number;
};

function fromRow(row: SessionRow): InterviewSession {
  return {
    id: row.id,
    completedAt: row.completed_at,
    role: row.role,
    candidateName: row.candidate_name,
    overall: row.overall,
    dimensions: row.dimensions,
    strengths: row.strengths,
    improvements: row.improvements,
    answerCount: row.answer_count,
  };
}

export function mergeSessionSummaries(
  local: InterviewSession[],
  remote: InterviewSession[],
) {
  return [...remote, ...local]
    .filter((session, index, sessions) =>
      sessions.findIndex(({ id }) => id === session.id) === index,
    )
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
}

export async function fetchRemoteSessions(accountId: string) {
  const client = getSupabaseClient();
  if (!client) return [];
  const { data, error } = await client
    .from("interview_sessions")
    .select("*")
    .eq("user_id", accountId)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return (data as SessionRow[]).map(fromRow);
}

export async function syncSessionSummary(accountId: string, session: InterviewSession) {
  const client = getSupabaseClient();
  if (!client) return;
  const row: SessionRow = {
    id: session.id,
    user_id: accountId,
    completed_at: session.completedAt,
    role: session.role,
    candidate_name: session.candidateName,
    overall: session.overall,
    dimensions: session.dimensions,
    strengths: session.strengths,
    improvements: session.improvements,
    answer_count: session.answerCount,
  };
  const { error } = await client.from("interview_sessions").upsert(row);
  if (error) throw error;
}

export async function deleteRemoteSessions(accountId: string) {
  const client = getSupabaseClient();
  if (!client) return;
  const { error } = await client.from("interview_sessions").delete().eq("user_id", accountId);
  if (error) throw error;
}
