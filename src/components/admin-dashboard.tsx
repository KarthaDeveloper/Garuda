"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  LogOut,
  Search,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { ROLE_META } from "@/lib/interview-engine";
import type { LocalIdentity } from "@/lib/local-identity";
import type { InterviewRole, InterviewSession } from "@/lib/types";
import { cn } from "@/lib/utils";

type Readiness = "Ready" | "Developing" | "Needs attention" | "Not started";
type CohortMember = {
  name: string;
  email: string;
  role: InterviewRole;
  completed: number;
  assigned: number;
  score: number | null;
  trend: number | null;
  lastPractice: string | null;
};

const SEEDED_COHORT: CohortMember[] = [
  { name: "Aarav Mehta", email: "aarav@northstar.edu", role: "software-engineer", completed: 3, assigned: 3, score: 82, trend: 7, lastPractice: "2026-09-05T13:20:00Z" },
  { name: "Diya Nair", email: "diya@northstar.edu", role: "product-manager", completed: 2, assigned: 3, score: 76, trend: 4, lastPractice: "2026-09-05T10:05:00Z" },
  { name: "Kabir Singh", email: "kabir@northstar.edu", role: "data-scientist", completed: 2, assigned: 3, score: 64, trend: 8, lastPractice: "2026-09-04T15:40:00Z" },
  { name: "Meera Iyer", email: "meera@northstar.edu", role: "software-engineer", completed: 1, assigned: 3, score: 58, trend: null, lastPractice: "2026-09-03T12:30:00Z" },
  { name: "Rohan Das", email: "rohan@northstar.edu", role: "product-manager", completed: 0, assigned: 3, score: null, trend: null, lastPractice: null },
  { name: "Sara Khan", email: "sara@northstar.edu", role: "data-scientist", completed: 3, assigned: 3, score: 79, trend: 11, lastPractice: "2026-09-05T16:10:00Z" },
  { name: "Vihaan Shah", email: "vihaan@northstar.edu", role: "software-engineer", completed: 1, assigned: 3, score: 61, trend: null, lastPractice: "2026-09-02T09:15:00Z" },
  { name: "Zoya Patel", email: "zoya@northstar.edu", role: "product-manager", completed: 0, assigned: 3, score: null, trend: null, lastPractice: null },
];

function readinessFor(score: number | null): Readiness {
  if (score === null) return "Not started";
  if (score >= 75) return "Ready";
  if (score >= 60) return "Developing";
  return "Needs attention";
}

function mergeLocalSessions(sessions: InterviewSession[]) {
  const grouped = new Map<string, InterviewSession[]>();
  sessions.forEach((session) => {
    const key = session.candidateName.toLowerCase();
    grouped.set(key, [...(grouped.get(key) || []), session]);
  });

  const members = [...SEEDED_COHORT];
  grouped.forEach((candidateSessions, key) => {
    const ordered = candidateSessions.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    const latest = ordered[0];
    const previous = ordered[1];
    const seededIndex = members.findIndex((member) => member.name.toLowerCase() === key);
    const member: CohortMember = {
      name: latest.candidateName,
      email: seededIndex >= 0 ? members[seededIndex].email : "Local candidate",
      role: latest.role,
      completed: ordered.length,
      assigned: Math.max(3, ordered.length),
      score: latest.overall,
      trend: previous ? latest.overall - previous.overall : null,
      lastPractice: latest.completedAt,
    };
    if (seededIndex >= 0) members[seededIndex] = member;
    else members.unshift(member);
  });
  return members;
}

export function AdminDashboard({
  identity,
  sessions,
  onSignOut,
}: {
  identity: LocalIdentity;
  sessions: InterviewSession[];
  onSignOut: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "ready" | "attention">("all");
  const [query, setQuery] = useState("");
  const cohort = useMemo(() => mergeLocalSessions(sessions), [sessions]);
  const filtered = cohort.filter((member) => {
    const readiness = readinessFor(member.score);
    const matchesFilter =
      filter === "all" ||
      (filter === "ready" && readiness === "Ready") ||
      (filter === "attention" && ["Needs attention", "Not started"].includes(readiness));
    return matchesFilter && `${member.name} ${member.email}`.toLowerCase().includes(query.toLowerCase());
  });
  const practiced = cohort.filter((member) => member.completed > 0);
  const average = practiced.length
    ? Math.round(practiced.reduce((sum, member) => sum + (member.score || 0), 0) / practiced.length)
    : 0;
  const ready = cohort.filter((member) => readinessFor(member.score) === "Ready").length;
  const attention = cohort.filter((member) =>
    ["Needs attention", "Not started"].includes(readinessFor(member.score)),
  ).length;

  return (
    <main className="min-h-svh bg-[#f7f3eb]">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div>
            <p className="font-heading text-lg font-semibold leading-none">Garuda for Teams</p>
            <p className="mt-1 text-[10px] font-semibold tracking-wider text-primary uppercase">
              Placement &amp; L&amp;D
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-semibold">{identity.name}</p>
              <p className="text-[10px] text-muted-foreground">{identity.organization}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onSignOut}>
              <LogOut /> <span className="hidden sm:inline">Switch persona</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
        <div>
          <Badge className="bg-primary/10 text-primary">Demo cohort · local workspace</Badge>
          <h1 className="mt-3 font-heading text-3xl font-semibold sm:text-4xl">Cohort readiness</h1>
          <p className="mt-2 text-muted-foreground">
            Know who has practiced, who is improving, and where coaching will have the most impact.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Candidates", value: cohort.length, helper: `${practiced.length} have practiced`, icon: Users },
            { label: "Completion", value: `${Math.round((practiced.length / cohort.length) * 100)}%`, helper: "At least one session", icon: CheckCircle2 },
            { label: "Average readiness", value: average, helper: "Across active candidates", icon: BarChart3 },
            { label: "Needs attention", value: attention, helper: `${ready} interview-ready`, icon: AlertTriangle },
          ].map((metric) => {
            const Icon = metric.icon;
            return (
              <Card key={metric.label} className="py-0">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
                    <Icon className="size-4 text-primary" />
                  </div>
                  <p className="mt-3 font-heading text-3xl font-semibold">{metric.value}</p>
                  <p className="mt-1 text-[10px] text-muted-foreground sm:text-xs">{metric.helper}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 py-0">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="font-heading text-xl font-semibold">Candidate readiness</h2>
                <p className="mt-1 text-xs text-muted-foreground">Practice activity and latest local score</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative">
                  <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
                  <Input
                    className="pl-9 sm:w-56"
                    placeholder="Search candidates"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </div>
                <div className="flex rounded-lg border border-border bg-secondary/35 p-1">
                  {(["all", "ready", "attention"] as const).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setFilter(item)}
                      className={cn(
                        "flex-1 rounded-md px-3 py-1.5 text-xs font-semibold capitalize transition",
                        filter === item ? "bg-background text-foreground shadow-sm" : "text-muted-foreground",
                      )}
                    >
                      {item === "attention" ? "Needs help" : item}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 hidden overflow-hidden rounded-xl border border-border md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-secondary/55 text-xs text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Candidate</th>
                    <th className="px-4 py-3 font-semibold">Target role</th>
                    <th className="px-4 py-3 font-semibold">Practice</th>
                    <th className="px-4 py-3 font-semibold">Readiness</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((member) => {
                    const readiness = readinessFor(member.score);
                    return (
                      <tr key={member.email} className="bg-background">
                        <td className="px-4 py-4">
                          <p className="font-semibold">{member.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">{member.email}</p>
                        </td>
                        <td className="px-4 py-4">{ROLE_META[member.role].short}</td>
                        <td className="px-4 py-4">
                          <p>{member.completed} of {member.assigned}</p>
                          <Progress className="mt-2 h-1.5 w-24" value={(member.completed / member.assigned) * 100} />
                        </td>
                        <td className="px-4 py-4">
                          {member.score === null ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <span className="font-heading text-xl font-semibold">
                              {member.score}
                              {member.trend !== null && (
                                <span className="ml-2 text-xs font-sans text-emerald-700">
                                  {member.trend >= 0 ? "+" : ""}{member.trend}
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4"><ReadinessBadge value={readiness} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 space-y-3 md:hidden">
              {filtered.map((member) => (
                <div key={member.email} className="rounded-xl border border-border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{ROLE_META[member.role].name}</p>
                    </div>
                    <ReadinessBadge value={readinessFor(member.score)} />
                  </div>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Practice</p>
                      <p className="mt-1 text-sm">{member.completed} of {member.assigned} sessions</p>
                    </div>
                    <p className="font-heading text-3xl font-semibold">{member.score ?? "—"}</p>
                  </div>
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No candidates match this view.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowUpRight className="size-3.5" />
          Production mode will sync verified candidate accounts across devices and institutions.
        </div>
      </div>
    </main>
  );
}

function ReadinessBadge({ value }: { value: Readiness }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        value === "Ready" && "border-emerald-200 bg-emerald-50 text-emerald-800",
        value === "Developing" && "border-amber-200 bg-amber-50 text-amber-900",
        value === "Needs attention" && "border-red-200 bg-red-50 text-red-800",
        value === "Not started" && "bg-secondary text-muted-foreground",
      )}
    >
      {value}
    </Badge>
  );
}
