"use client";

import { useState } from "react";
import {
  ArrowRight,
  BarChart3,
  Building2,
  Clock3,
  LockKeyhole,
  Mic,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LocalIdentity } from "@/lib/local-identity";

export function PersonaEntry({
  onLogin,
}: {
  onLogin: (identity: LocalIdentity) => void;
}) {
  const [mode, setMode] = useState<"candidate" | "admin">("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.includes("@")) return;
    onLogin({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      persona: mode,
      organization: mode === "admin" ? organization.trim() || "Garuda Demo Cohort" : undefined,
    });
  }

  function selectMode(nextMode: typeof mode) {
    setMode(nextMode);
    setName("");
    setEmail("");
    setOrganization("");
    if (nextMode === "admin") {
      window.setTimeout(() => document.getElementById("account-entry")?.scrollIntoView({ behavior: "smooth" }), 0);
    }
  }

  return (
    <main className="paper-grid min-h-svh">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <span className="font-heading text-xl font-bold">G</span>
            </div>
            <div>
              <p className="font-heading text-lg font-semibold leading-none">Garuda</p>
              <p className="mt-1 text-[10px] font-semibold tracking-[0.17em] text-primary uppercase">
                AI Interviewer
              </p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <LockKeyhole className="size-3" /> Private by design
          </Badge>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_.75fr]">
        <div>
          <Badge className="gap-2 rounded-full px-3 py-1.5">
            <Sparkles className="size-3.5" /> Resume-aware practice
          </Badge>
          <h1 className="mt-6 max-w-2xl font-heading text-5xl leading-[1.04] font-semibold tracking-tight sm:text-6xl">
            Walk into the interview
            <span className="block text-primary italic">knowing your signal.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Practice realistic questions grounded in your experience, hear how you actually
            answer, and track what gets stronger each time.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["5", "Core questions"],
              ["2 max", "Adaptive probes"],
              ["3", "Role tracks"],
              ["Local", "Private scoring"],
            ].map(([value, label]) => (
              <div key={label} className="rounded-xl border border-border bg-card/75 p-3">
                <p className="font-heading text-2xl font-semibold text-primary">{value}</p>
                <p className="mt-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Card id="account-entry" className="border-border/80 bg-card/95 py-0 shadow-xl shadow-primary/10">
          <CardContent className="p-5 sm:p-7">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                {mode === "candidate" ? <UserRound /> : <Building2 />}
              </span>
              <div>
                <p className="text-xs font-bold tracking-wider text-primary uppercase">
                  {mode === "candidate" ? "Candidate" : "Placement / L&D"}
                </p>
                <h2 className="font-heading text-2xl font-semibold">
                  {mode === "candidate" ? "Start your practice" : "Open your cohort"}
                </h2>
              </div>
            </div>

            <form className="mt-6" onSubmit={submit}>
              <label className="text-sm font-semibold">
                Your name
                <Input
                  className="mt-2"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder={mode === "candidate" ? "Maya Rao" : "Anita Sharma"}
                  autoComplete="name"
                />
              </label>
              <label className="mt-4 block text-sm font-semibold">
                {mode === "candidate" ? "Email" : "Work email"}
                <Input
                  className="mt-2"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                />
              </label>
              {mode === "admin" && (
                <label className="mt-4 block text-sm font-semibold">
                  Institution or cohort
                  <Input
                    className="mt-2"
                    value={organization}
                    onChange={(event) => setOrganization(event.target.value)}
                    placeholder="Northstar Institute · 2026 cohort"
                  />
                </label>
              )}
              <Button className="mt-6 h-12 w-full text-base" disabled={!name.trim() || !email.includes("@")}>
                {mode === "candidate" ? "Start as a candidate" : "Continue to cohort"}
                <ArrowRight />
              </Button>
              {mode === "admin" && (
                <button
                  type="button"
                  onClick={() => selectMode("candidate")}
                  className="mt-3 w-full text-center text-xs font-semibold text-primary hover:underline"
                >
                  Back to candidate entry
                </button>
              )}
            </form>
          </CardContent>
        </Card>
      </section>

      <section className="border-y border-border bg-card/60">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-9 sm:grid-cols-3 sm:px-6">
          {[
            {
              icon: Mic,
              title: "Answer naturally",
              copy: "Use voice where supported or type. Your transcript stays editable.",
            },
            {
              icon: BarChart3,
              title: "Get evidence, not vibes",
              copy: "See structure, specificity, delivery, and role-depth signals.",
            },
            {
              icon: Clock3,
              title: "Track the change",
              copy: "Compare scores and coaching dimensions across practice sessions.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <div>
                  <h2 className="font-semibold">{item.title}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.copy}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-5 rounded-2xl border border-border bg-[#28231f] p-6 text-center text-[#fff9ef] sm:flex-row sm:text-left">
          <div className="flex items-center gap-4">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/10">
              <ShieldCheck />
            </span>
            <div>
              <h2 className="font-heading text-xl font-semibold">Preparing a cohort?</h2>
              <p className="mt-1 text-sm text-[#d7c9ba]">
                Placement and L&amp;D teams can track completion and readiness.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white"
            onClick={() => selectMode("admin")}
          >
            Admin / L&amp;D login <ArrowRight />
          </Button>
        </div>
        <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
          Privileged roles are provisioned by trusted authentication. Super Admin access is never
          available through public self-selection.
        </p>
      </section>
    </main>
  );
}
