"use client";

import { useState } from "react";
import { ArrowRight, Building2, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { LocalIdentity, UserPersona } from "@/lib/local-identity";
import { cn } from "@/lib/utils";

export function PersonaEntry({
  onLogin,
}: {
  onLogin: (identity: LocalIdentity) => void;
}) {
  const [persona, setPersona] = useState<UserPersona>("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.includes("@")) return;
    onLogin({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      persona,
      organization:
        persona === "candidate"
          ? undefined
          : organization.trim() || (persona === "super-admin" ? "Garuda" : "Garuda Demo Cohort"),
    });
  }

  return (
    <main className="paper-grid min-h-svh">
      <header className="border-b border-border/70 bg-background/85">
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
            <LockKeyhole className="size-3" /> Local demo login
          </Badge>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">One product, governed access</p>
          <h1 className="mt-3 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
            How will you use Garuda?
          </h1>
          <p className="mt-4 text-base leading-7 text-muted-foreground">
            Candidates practice, placement teams guide cohorts, and super admins govern access.
          </p>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {([
            {
              id: "candidate" as const,
              label: "Candidate",
              title: "Practice. Hear yourself. Improve.",
              copy: "Get resume-grounded questions, a live voice loop, and specific coaching before the real interview.",
              icon: UserRound,
            },
            {
              id: "admin" as const,
              label: "Placement / L&D",
              title: "Make readiness visible.",
              copy: "Track participation, compare readiness signals, and focus coaching on the candidates who need it.",
              icon: Building2,
            },
            {
              id: "super-admin" as const,
              label: "Super Admin",
              title: "Govern accounts and roles.",
              copy: "Manage candidate and admin access, account status, institutions, and platform oversight.",
              icon: ShieldCheck,
            },
          ]).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setPersona(item.id)}
                className={cn(
                  "rounded-2xl border bg-card p-5 text-left transition sm:p-6",
                  persona === item.id
                    ? "border-primary ring-2 ring-primary/15"
                    : "border-border hover:border-primary/40",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon />
                  </span>
                  <span
                    className={cn(
                      "grid size-5 place-items-center rounded-full border",
                      persona === item.id && "border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {persona === item.id && <span className="size-1.5 rounded-full bg-current" />}
                  </span>
                </div>
                <p className="mt-5 text-xs font-bold tracking-wider text-primary uppercase">{item.label}</p>
                <h2 className="mt-2 font-heading text-2xl font-semibold">{item.title}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{item.copy}</p>
              </button>
            );
          })}
        </div>

        <Card className="mx-auto mt-6 max-w-2xl py-0">
          <CardContent className="p-5 sm:p-7">
            <form onSubmit={submit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold">
                  Your name
                  <Input
                    className="mt-2"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder={
                      persona === "candidate"
                        ? "Maya Rao"
                        : persona === "admin"
                          ? "Anita Sharma"
                          : "Garuda Operations"
                    }
                    autoComplete="name"
                  />
                </label>
                <label className="text-sm font-semibold">
                  {persona === "candidate" ? "Email" : "Work email"}
                  <Input
                    className="mt-2"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                  />
                </label>
              </div>
              {persona !== "candidate" && (
                <label className="mt-4 block text-sm font-semibold">
                  Institution or cohort
                  <Input
                    className="mt-2"
                    value={organization}
                    onChange={(event) => setOrganization(event.target.value)}
                    placeholder={persona === "admin" ? "Northstar Institute · 2026 cohort" : "Garuda"}
                  />
                </label>
              )}
              <Button className="mt-6 h-12 w-full text-base" disabled={!name.trim() || !email.includes("@")}>
                Continue as{" "}
                {persona === "candidate"
                  ? "candidate"
                  : persona === "admin"
                    ? "placement admin"
                    : "super admin"}
                <ArrowRight />
              </Button>
              <p className="mt-3 text-center text-xs leading-5 text-muted-foreground">
                MVP demo identity is stored only in this browser. Production team access will use verified,
                role-based authentication.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
