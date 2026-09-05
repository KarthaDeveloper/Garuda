"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { jsPDF } from "jspdf";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  ChevronUp,
  CircleStop,
  Clock3,
  FileText,
  Gauge,
  GraduationCap,
  History,
  Laptop2,
  LoaderCircle,
  LockKeyhole,
  Mic,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Trash2,
  UploadCloud,
  Volume2,
  WandSparkles,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useSpeech } from "@/hooks/use-speech";
import { createReport, scoreAnswer } from "@/lib/analytics";
import {
  createAdaptiveFollowUp,
  createQuestionSet,
  enhanceFollowUpLocally,
  nextBaseQuestion,
  ROLE_META,
} from "@/lib/interview-engine";
import { loadSampleProfile, parseResume } from "@/lib/resume-parser";
import {
  clearSessionHistory,
  createSessionSummary,
  readSessionHistory,
  saveSessionSummary,
} from "@/lib/session-history";
import type {
  CandidateProfile,
  InterviewAnswer,
  InterviewReport,
  InterviewRole,
  InterviewSession,
  Question,
} from "@/lib/types";
import { cn } from "@/lib/utils";

type Screen = "home" | "setup" | "interview" | "report" | "history";
type ModelMode = "checking" | "on-device" | "fallback";

const ROLES = Object.keys(ROLE_META) as InterviewRole[];

function GarudaLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <svg viewBox="0 0 32 32" className="size-6" aria-hidden="true">
          <path
            fill="currentColor"
            d="M16 3.5c2.2 3.4 3.6 6.2 4.2 8.6 2.8-.8 5.8-1 8.8-.4-2.2 2.6-4.8 4.4-7.6 5.4 1.2 2.8 1.6 5.8 1.2 9.2-2.4-2.2-4.4-4.8-5.6-7.6-1.2 2.8-3.2 5.4-5.6 7.6-.4-3.4 0-6.4 1.2-9.2-2.8-1-5.4-2.8-7.6-5.4 3-.6 6-.4 8.8.4C12.4 9.7 13.8 6.9 16 3.5Z"
          />
        </svg>
      </div>
      {!compact && (
        <div>
          <p className="font-heading text-lg font-semibold leading-none">Garuda</p>
          <p className="mt-1 text-[10px] font-semibold tracking-[0.17em] text-primary uppercase">
            AI Interviewer
          </p>
        </div>
      )}
    </div>
  );
}

function AppHeader({
  step,
  onBack,
}: {
  step?: string;
  onBack?: () => void;
}) {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} aria-label="Go back">
              <ArrowLeft />
            </Button>
          )}
          <GarudaLogo compact={Boolean(onBack)} />
        </div>
        <div className="flex items-center gap-2">
          {step && <span className="hidden text-xs text-muted-foreground sm:block">{step}</span>}
          <Badge variant="outline" className="gap-1.5 border-emerald-700/20 bg-emerald-50 text-emerald-800">
            <LockKeyhole className="size-3" />
            Private by design
          </Badge>
        </div>
      </div>
    </header>
  );
}

function HomeScreen({
  onStart,
  onHistory,
  sessionCount,
}: {
  onStart: () => void;
  onHistory: () => void;
  sessionCount: number;
}) {
  return (
    <main className="paper-grid min-h-svh">
      <AppHeader />
      <section className="mx-auto grid min-h-[calc(100svh-4rem)] max-w-6xl items-center gap-12 px-5 py-12 lg:grid-cols-[1.05fr_.95fr] lg:px-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <Badge className="mb-6 gap-2 rounded-full px-3 py-1.5">
            <Sparkles className="size-3.5" />
            Your interview room, on your device
          </Badge>
          <h1 className="max-w-3xl font-heading text-5xl leading-[1.02] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            Practice the interview.
            <span className="block text-primary italic">Own the room.</span>
          </h1>
          <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
            Garuda turns your resume into a realistic voice interview, follows the thread,
            and gives you evidence-backed coaching—without sending your story to a server.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="h-12 px-6 text-base" onClick={onStart}>
              Start a practice interview
              <ArrowRight />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="h-12 px-6 text-base"
              onClick={onHistory}
            >
              <History />
              Progress
              {sessionCount > 0 && <Badge variant="secondary">{sessionCount}</Badge>}
            </Button>
            <div className="flex items-center justify-center gap-2 px-3 text-sm text-muted-foreground">
              <Clock3 className="size-4" />
              10–15 minutes · no sign-up
            </div>
          </div>
          <div className="mt-10 grid max-w-xl grid-cols-3 gap-3">
            {[
              ["01", "Resume-aware"],
              ["02", "Voice-first"],
              ["03", "Actionable score"],
            ].map(([number, label]) => (
              <div key={number} className="border-t border-border pt-3">
                <p className="font-mono text-xs text-primary">{number}</p>
                <p className="mt-1 text-xs font-medium sm:text-sm">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12 }}
          className="relative mx-auto w-full max-w-md"
        >
          <div className="absolute -inset-6 -z-10 rounded-full bg-primary/10 blur-3xl" />
          <Card className="overflow-hidden border-border/80 bg-card/95 py-0 shadow-2xl shadow-primary/10">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground">
                  <BrainCircuit className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Garuda is listening</p>
                  <p className="text-xs text-muted-foreground">Technical depth · Question 3</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-primary">
                <span className="size-2 animate-pulse rounded-full bg-primary" /> Live
              </span>
            </div>
            <CardContent className="space-y-6 px-5 py-7">
              <p className="font-heading text-xl leading-8">
                “What trade-off did you make when the migration started affecting checkout
                latency?”
              </p>
              <div className="flex h-16 items-center justify-center gap-1.5">
                {[12, 24, 37, 54, 28, 44, 62, 38, 20, 46, 31, 16].map((height, index) => (
                  <motion.span
                    key={index}
                    animate={{ height: [height * 0.55, height, height * 0.45] }}
                    transition={{ repeat: Infinity, duration: 1.1, delay: index * 0.06 }}
                    className="w-1.5 rounded-full bg-primary/75"
                  />
                ))}
              </div>
              <div className="rounded-xl bg-secondary/70 p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold">Live coaching signal</span>
                  <span className="text-muted-foreground">01:18</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Strong ownership. Add the before-and-after metric.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>
    </main>
  );
}

function SetupScreen({
  onBack,
  onStart,
}: {
  onBack: () => void;
  onStart: (profile: CandidateProfile, role: InterviewRole) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [role, setRole] = useState<InterviewRole>("software-engineer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file?: File) {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      setProfile(await parseResume(file));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not read that resume.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-svh">
      <AppHeader step="Set up your interview" onBack={onBack} />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">Your briefing</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold sm:text-4xl">
            Make it feel like your interview.
          </h1>
          <p className="mt-2 text-muted-foreground">
            Your resume is parsed in this browser and disappears when you close the tab.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">1. Add your resume</h2>
              <button
                onClick={() => {
                  setProfile(loadSampleProfile());
                  setError(null);
                }}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Use sample resume
              </button>
            </div>
            <input
              ref={fileInput}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={(event) => void handleFile(event.target.files?.[0])}
            />
            {!profile ? (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDrop={(event) => {
                  event.preventDefault();
                  void handleFile(event.dataTransfer.files[0]);
                }}
                onDragOver={(event) => event.preventDefault()}
                className="flex min-h-64 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border bg-card/60 p-8 text-center transition hover:border-primary/60 hover:bg-card"
              >
                {loading ? (
                  <LoaderCircle className="size-10 animate-spin text-primary" />
                ) : (
                  <UploadCloud className="size-10 text-primary" />
                )}
                <p className="mt-4 font-semibold">{loading ? "Reading your experience…" : "Drop your resume here"}</p>
                <p className="mt-1 text-sm text-muted-foreground">PDF, DOCX, or TXT · up to 8 MB</p>
                <Badge variant="outline" className="mt-5">Never uploaded</Badge>
              </button>
            ) : (
              <Card className="min-h-64 py-0">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                        <FileText />
                      </div>
                      <div>
                        <p className="font-semibold">{profile.name}</p>
                        <p className="text-xs text-muted-foreground">{profile.headline}</p>
                      </div>
                    </div>
                    <Badge className="gap-1 bg-emerald-700">
                      <Check className="size-3" /> Ready
                    </Badge>
                  </div>
                  <p className="mt-5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                    Context found
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {profile.skills.slice(0, 8).map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                  {profile.experience[0] && (
                    <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted-foreground">
                      {profile.experience[0]}
                    </p>
                  )}
                  <button
                    onClick={() => fileInput.current?.click()}
                    className="mt-4 text-xs font-semibold text-primary hover:underline"
                  >
                    Choose a different resume
                  </button>
                </CardContent>
              </Card>
            )}
            {error && <p className="mt-3 text-sm font-medium text-destructive">{error}</p>}
          </section>

          <section>
            <h2 className="mb-3 font-semibold">2. Choose the role</h2>
            <div className="space-y-3">
              {ROLES.map((item) => {
                const meta = ROLE_META[item];
                const Icon =
                  item === "software-engineer"
                    ? Laptop2
                    : item === "product-manager"
                      ? BriefcaseBusiness
                      : BarChart3;
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setRole(item)}
                    className={cn(
                      "flex w-full items-center gap-4 rounded-2xl border bg-card p-4 text-left transition",
                      role === item
                        ? "border-primary ring-2 ring-primary/15"
                        : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className={cn("grid size-11 place-items-center rounded-xl border", meta.color)}>
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{meta.name}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{meta.description}</span>
                    </span>
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full border",
                        role === item ? "border-primary bg-primary text-primary-foreground" : "border-border",
                      )}
                    >
                      {role === item && <Check className="size-3" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 rounded-xl border border-border bg-secondary/45 p-4 text-sm">
              <div className="flex gap-3">
                <Clock3 className="mt-0.5 size-4 text-primary" />
                <div>
                  <p className="font-semibold">5 core questions · adaptive probes</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Voice works in supported browsers. Typing always works.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            size="lg"
            className="h-12 w-full px-6 sm:w-auto"
            disabled={!profile}
            onClick={() => profile && onStart(profile, role)}
          >
            Enter the interview room
            <ArrowRight />
          </Button>
        </div>
      </div>
    </main>
  );
}

function InterviewScreen({
  profile,
  role,
  onFinish,
  onExit,
}: {
  profile: CandidateProfile;
  role: InterviewRole;
  onFinish: (answers: InterviewAnswer[]) => void;
  onExit: () => void;
}) {
  const questions = useMemo(() => createQuestionSet(profile, role), [profile, role]);
  const [question, setQuestion] = useState<Question>(questions[0]);
  const [answers, setAnswers] = useState<InterviewAnswer[]>([]);
  const [transcript, setTranscript] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [submitted, setSubmitted] = useState<InterviewAnswer | null>(null);
  const [modelMode, setModelMode] = useState<ModelMode>("checking");
  const [isPreparing, setIsPreparing] = useState(false);
  const [autoSpoken, setAutoSpoken] = useState(false);
  const speech = useSpeech(setTranscript);

  useEffect(() => {
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [question.id]);

  useEffect(() => {
    if (!autoSpoken) {
      const timer = window.setTimeout(() => {
        speech.speak(question.text);
        setAutoSpoken(true);
      }, 500);
      return () => window.clearTimeout(timer);
    }
  }, [autoSpoken, question.text, speech]);

  function resetFor(next: Question) {
    setQuestion(next);
    setTranscript("");
    setSeconds(0);
    setSubmitted(null);
    setAutoSpoken(false);
  }

  function submitAnswer() {
    if (transcript.trim().length < 12) return;
    speech.stop();
    const score = scoreAnswer(transcript, question, seconds, speech.pauseCount);
    const answer = {
      question,
      transcript: transcript.trim(),
      durationSeconds: score.metrics.durationSeconds,
      pauses: speech.pauseCount,
      score,
    };
    setAnswers((current) => [...current, answer]);
    setSubmitted(answer);
  }

  async function continueInterview() {
    if (!submitted) return;
    setIsPreparing(true);
    try {
      const submittedIsRecorded = answers.some(
        (answer) =>
          answer.question.id === submitted.question.id &&
          answer.transcript === submitted.transcript,
      );
      const allAnswers = submittedIsRecorded ? answers : [...answers, submitted];
      const baseAnswers = allAnswers.filter((answer) => !answer.question.isFollowUp);
      const followUpsForCurrent = allAnswers.filter((answer) =>
        answer.question.id.startsWith(question.id.split("-follow-")[0] + "-follow-"),
      ).length;
      const fallback =
        !question.isFollowUp && followUpsForCurrent < 1
          ? createAdaptiveFollowUp(submitted.transcript, question, allAnswers.length)
          : null;
      if (fallback) {
        const enhanced = await enhanceFollowUpLocally(fallback, submitted.transcript, role);
        setModelMode(enhanced.model);
        resetFor(enhanced.question);
        return;
      }
      const next = nextBaseQuestion(questions, baseAnswers);
      if (!next || baseAnswers.length >= questions.length) {
        onFinish(allAnswers);
        return;
      }
      if (modelMode === "checking") setModelMode("fallback");
      resetFor(next);
    } finally {
      setIsPreparing(false);
    }
  }

  const coreAnswered = answers.filter((answer) => !answer.question.isFollowUp).length;
  const currentBaseIndex = Math.max(
    0,
    questions.findIndex((item) => question.id === item.id || question.id.startsWith(`${item.id}-follow-`)),
  );
  const progress = Math.min(100, (coreAnswered / questions.length) * 100);
  const time = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  return (
    <main className="min-h-svh bg-[#f7f3eb]">
      <AppHeader step={`${ROLE_META[role].name} interview`} onBack={onExit} />
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1">
            <div className="mb-2 flex justify-between text-xs">
              <span className="font-semibold">Question {currentBaseIndex + 1} of 5</span>
              <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
            </div>
            <Progress value={progress} />
          </div>
          <Badge variant="outline" className="hidden gap-1.5 sm:flex">
            <BrainCircuit className="size-3" />
            {modelMode === "on-device" ? "On-device AI" : "Local fallback"}
          </Badge>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
          <section className="space-y-5">
            <Card className="overflow-hidden py-0 shadow-sm">
              <div className="flex items-center justify-between border-b border-border bg-secondary/35 px-4 py-3 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-full bg-primary text-primary-foreground">
                    <BrainCircuit className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Garuda</p>
                    <p className="text-[11px] text-muted-foreground">{question.competency}</p>
                  </div>
                </div>
                {question.isFollowUp && <Badge variant="secondary">Adaptive follow-up</Badge>}
              </div>
              <CardContent className="px-5 py-7 sm:px-8 sm:py-10">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                  >
                    {question.source && (
                      <p className="mb-3 text-[11px] font-bold tracking-wider text-primary uppercase">
                        {question.source}
                      </p>
                    )}
                    <h1 className="font-heading text-2xl leading-9 font-medium sm:text-3xl sm:leading-11">
                      {question.text}
                    </h1>
                    <Button variant="ghost" size="sm" className="mt-5 text-primary" onClick={() => speech.speak(question.text)}>
                      <Volume2 /> Hear it again
                    </Button>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>

            {!submitted ? (
              <Card className="py-0">
                <CardContent className="p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold">Your answer</p>
                    <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                      <Clock3 className="size-3.5" /> {time}
                    </span>
                  </div>
                  <Textarea
                    value={transcript}
                    onChange={(event) => setTranscript(event.target.value)}
                    placeholder="Speak or type your answer. Use a specific example: context, your actions, and the outcome."
                    className="min-h-44 resize-none bg-background text-base leading-7"
                  />
                  {speech.error && <p className="mt-2 text-xs text-destructive">{speech.error}</p>}
                  <div className="mt-4 flex items-center gap-3">
                    <Button
                      type="button"
                      size="lg"
                      variant={speech.isListening ? "destructive" : "outline"}
                      className="size-12 rounded-full p-0"
                      onClick={speech.isListening ? speech.stop : speech.start}
                      aria-label={speech.isListening ? "Stop recording" : "Start voice answer"}
                    >
                      {speech.isListening ? <CircleStop /> : <Mic />}
                    </Button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">
                        {speech.isListening ? "Listening…" : speech.supported ? "Tap the mic to answer" : "Type your answer"}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Review and edit the transcript before submitting.
                      </p>
                    </div>
                    <Button disabled={transcript.trim().length < 12} onClick={submitAnswer}>
                      Submit
                      <ArrowRight />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-primary/25 py-0">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold tracking-wider text-primary uppercase">Instant signal</p>
                      <h2 className="mt-1 font-heading text-2xl font-semibold">{submitted.score.overall}/100</h2>
                    </div>
                    <Badge variant="secondary">{submitted.score.metrics.clarityLabel}</Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2">
                    {[
                      [submitted.score.metrics.wordsPerMinute, "words/min"],
                      [submitted.score.metrics.fillerCount, "fillers"],
                      [submitted.score.metrics.pauseCount, "pauses"],
                    ].map(([value, label]) => (
                      <div key={label} className="rounded-xl bg-secondary/55 p-3 text-center">
                        <p className="font-heading text-xl font-semibold">{value}</p>
                        <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {submitted.score.strengths[0] || submitted.score.improvements[0]}
                  </p>
                  <Button className="mt-5 w-full" onClick={() => void continueInterview()} disabled={isPreparing}>
                    {isPreparing ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
                    {coreAnswered >= questions.length && !question.isFollowUp ? "Build my report" : "Continue"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </section>

          <aside className="space-y-4">
            <Card className="py-0">
              <CardContent className="p-4">
                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Briefing card</p>
                <div className="mt-4 flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-full bg-secondary font-heading font-semibold text-primary">
                    {profile.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{profile.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{profile.headline}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-1">
                  {profile.skills.slice(0, 5).map((skill) => (
                    <Badge key={skill} variant="secondary" className="text-[10px]">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="py-0">
              <CardContent className="p-4">
                <p className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Answer framework</p>
                <div className="mt-3 space-y-3">
                  {[
                    ["C", "Context", "Set the scene briefly"],
                    ["A", "Action", "Say what you did"],
                    ["R", "Result", "Quantify the change"],
                  ].map(([letter, title, helper]) => (
                    <div key={letter} className="flex gap-3">
                      <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{letter}</span>
                      <div>
                        <p className="text-xs font-semibold">{title}</p>
                        <p className="text-[11px] text-muted-foreground">{helper}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </main>
  );
}

const DIMENSION_LABELS: Record<keyof InterviewReport["dimensions"], string> = {
  relevance: "Relevance",
  structure: "Structure",
  specificity: "Specificity",
  communication: "Communication",
  competency: "Role depth",
};

function HistoryScreen({
  sessions,
  onBack,
  onStart,
  onClear,
}: {
  sessions: InterviewSession[];
  onBack: () => void;
  onStart: () => void;
  onClear: () => void;
}) {
  const latest = sessions[0];
  const previous = sessions[1];
  const overallDelta = latest && previous ? latest.overall - previous.overall : null;
  const trend = sessions.slice(0, 8).reverse();

  return (
    <main className="min-h-svh">
      <AppHeader step="Your progress" onBack={onBack} />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.2em] text-primary uppercase">
              Practice history
            </p>
            <h1 className="mt-2 font-heading text-3xl font-semibold sm:text-4xl">
              See the signal getting stronger.
            </h1>
            <p className="mt-2 text-muted-foreground">
              Session summaries stay in this browser. Resumes and transcripts are never saved.
            </p>
          </div>
          <Button onClick={onStart}>
            Practice again <ArrowRight />
          </Button>
        </div>

        {!latest ? (
          <Card className="mt-8 border-dashed py-0">
            <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <TrendingUp />
              </div>
              <h2 className="mt-4 font-heading text-2xl font-semibold">Your first baseline starts here.</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Complete an interview and Garuda will chart your overall score and coaching
                dimensions across future sessions.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mt-8 grid gap-5 md:grid-cols-[260px_1fr]">
              <Card className="bg-[#28231f] py-0 text-[#fff9ef]">
                <CardContent className="p-6">
                  <p className="text-xs font-semibold tracking-wider text-[#d7c9ba] uppercase">
                    Latest score
                  </p>
                  <div className="mt-3 flex items-end gap-3">
                    <p className="font-heading text-6xl font-semibold">{latest.overall}</p>
                    {overallDelta !== null && (
                      <Badge className={overallDelta >= 0 ? "mb-2 bg-emerald-700" : "mb-2 bg-primary"}>
                        {overallDelta >= 0 ? "+" : ""}
                        {overallDelta} vs last
                      </Badge>
                    )}
                  </div>
                  <p className="mt-4 text-sm text-[#d7c9ba]">{ROLE_META[latest.role].name}</p>
                  <p className="mt-1 text-xs text-[#a99b8d]">
                    {new Date(latest.completedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </CardContent>
              </Card>

              <Card className="py-0">
                <CardContent className="p-5 sm:p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h2 className="font-heading text-xl font-semibold">Score trend</h2>
                      <p className="text-xs text-muted-foreground">Oldest to newest · last 8 sessions</p>
                    </div>
                    <TrendingUp className="text-primary" />
                  </div>
                  <div className="flex h-44 items-end gap-2">
                    {trend.map((session, index) => (
                      <div key={session.id} className="flex h-full min-w-0 flex-1 flex-col justify-end">
                        <p className="mb-1 text-center font-mono text-[10px] font-semibold">
                          {session.overall}
                        </p>
                        <div
                          className={cn(
                            "min-h-2 rounded-t-md",
                            index === trend.length - 1 ? "bg-primary" : "bg-primary/30",
                          )}
                          style={{ height: `${session.overall}%` }}
                          title={`${ROLE_META[session.role].name}: ${session.overall}`}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
              <section>
                <h2 className="mb-3 font-heading text-xl font-semibold">Previous sessions</h2>
                <div className="space-y-3">
                  {sessions.map((session, index) => {
                    const older = sessions[index + 1];
                    const delta = older ? session.overall - older.overall : null;
                    return (
                      <Card key={session.id} className="py-0">
                        <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                          <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-secondary font-heading text-xl font-semibold text-primary">
                            {session.overall}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-semibold">{ROLE_META[session.role].name}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {new Date(session.completedAt).toLocaleString(undefined, {
                                month: "short",
                                day: "numeric",
                                hour: "numeric",
                                minute: "2-digit",
                              })}{" "}
                              · {session.answerCount} answers
                            </p>
                          </div>
                          {delta !== null && (
                            <span className={cn("text-sm font-semibold", delta >= 0 ? "text-emerald-700" : "text-primary")}>
                              {delta >= 0 ? "+" : ""}
                              {delta}
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>

              <aside className="space-y-4">
                <Card className="py-0">
                  <CardContent className="p-5">
                    <h2 className="font-heading text-xl font-semibold">Latest dimensions</h2>
                    <div className="mt-5 space-y-4">
                      {Object.entries(latest.dimensions).map(([key, value]) => {
                        const prior = previous?.dimensions[key as keyof typeof latest.dimensions];
                        const delta = prior === undefined ? null : value - prior;
                        return (
                          <div key={key}>
                            <div className="mb-1.5 flex justify-between text-sm">
                              <span>{DIMENSION_LABELS[key as keyof typeof DIMENSION_LABELS]}</span>
                              <span className="font-semibold">
                                {value}
                                {delta !== null && (
                                  <span className="ml-1 text-xs text-muted-foreground">
                                    ({delta >= 0 ? "+" : ""}{delta})
                                  </span>
                                )}
                              </span>
                            </div>
                            <Progress value={value} />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Delete all interview history stored in this browser?")) {
                      onClear();
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border p-3 text-sm font-semibold text-muted-foreground transition hover:border-destructive/30 hover:text-destructive"
                >
                  <Trash2 className="size-4" /> Delete local history
                </button>
              </aside>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function ReportScreen({
  report,
  profile,
  role,
  onRestart,
}: {
  report: InterviewReport;
  profile: CandidateProfile;
  role: InterviewRole;
  onRestart: () => void;
}) {
  const [expanded, setExpanded] = useState(0);

  function downloadReport() {
    const pdf = new jsPDF();
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(24);
    pdf.text("Garuda Interview Report", 18, 22);
    pdf.setFontSize(12);
    pdf.text(`${profile.name} · ${ROLE_META[role].name}`, 18, 32);
    pdf.setFontSize(42);
    pdf.setTextColor(200, 70, 27);
    pdf.text(`${report.overall}/100`, 18, 54);
    pdf.setTextColor(35, 31, 28);
    pdf.setFontSize(14);
    pdf.text("Scorecard", 18, 69);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(11);
    let y = 78;
    Object.entries(report.dimensions).forEach(([key, value]) => {
      pdf.text(`${DIMENSION_LABELS[key as keyof typeof DIMENSION_LABELS]}: ${value}/100`, 18, y);
      y += 8;
    });
    y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("Strengths", 18, y);
    pdf.setFont("helvetica", "normal");
    y += 8;
    report.strengths.forEach((item) => {
      pdf.text(`• ${item}`, 22, y);
      y += 7;
    });
    y += 5;
    pdf.setFont("helvetica", "bold");
    pdf.text("Next practice", 18, y);
    pdf.setFont("helvetica", "normal");
    y += 8;
    report.improvements.forEach((item) => {
      const lines = pdf.splitTextToSize(`• ${item}`, 165);
      pdf.text(lines, 22, y);
      y += lines.length * 6 + 2;
    });
    pdf.save(`garuda-report-${profile.name.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  }

  return (
    <main className="min-h-svh">
      <AppHeader step="Interview complete" />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <section className="overflow-hidden rounded-3xl bg-[#28231f] p-6 text-[#fff9ef] shadow-xl sm:p-10">
          <div className="grid items-center gap-8 md:grid-cols-[220px_1fr]">
            <div
              className="score-ring relative mx-auto grid size-48 place-items-center rounded-full"
              style={{ "--score": report.overall } as React.CSSProperties}
            >
              <div className="grid size-40 place-items-center rounded-full bg-[#28231f] text-center">
                <div>
                  <p className="font-heading text-5xl font-semibold">{report.overall}</p>
                  <p className="text-xs tracking-wider text-[#d7c9ba] uppercase">Overall score</p>
                </div>
              </div>
            </div>
            <div>
              <Badge className="bg-primary text-primary-foreground">Session complete</Badge>
              <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
                {report.overall >= 75 ? "You made the story yours." : "The substance is there. Sharpen the signal."}
              </h1>
              <p className="mt-3 max-w-2xl leading-7 text-[#d7c9ba]">
                {profile.name}, here is your evidence-based review for the {ROLE_META[role].name} interview.
                Scores come from answer structure, specificity, role signals, and delivery—not a hiring prediction.
              </p>
              <div className="no-print mt-6 flex flex-col gap-2 sm:flex-row">
                <Button onClick={downloadReport}>
                  <FileText /> Download report
                </Button>
                <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => window.print()}>
                  Print
                </Button>
                <Button variant="ghost" className="text-white hover:bg-white/10 hover:text-white" onClick={onRestart}>
                  <RotateCcw /> Practice again
                </Button>
              </div>
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-6">
            <Card className="py-0">
              <CardContent className="p-5 sm:p-6">
                <div className="mb-5 flex items-center gap-2">
                  <Gauge className="size-5 text-primary" />
                  <h2 className="font-heading text-xl font-semibold">Your scorecard</h2>
                </div>
                <div className="space-y-4">
                  {Object.entries(report.dimensions).map(([key, value]) => (
                    <div key={key}>
                      <div className="mb-1.5 flex justify-between text-sm">
                        <span>{DIMENSION_LABELS[key as keyof typeof DIMENSION_LABELS]}</span>
                        <span className="font-semibold">{value}</span>
                      </div>
                      <Progress value={value} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="mb-3 font-heading text-xl font-semibold">Question-by-question</h2>
              <div className="space-y-3">
                {report.answers.map((answer, index) => (
                  <Card key={`${answer.question.id}-${index}`} className="py-0">
                    <button
                      className="flex w-full items-start gap-3 p-4 text-left sm:p-5"
                      onClick={() => setExpanded(expanded === index ? -1 : index)}
                    >
                      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-secondary font-mono text-xs text-primary">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="line-clamp-2 text-sm font-semibold">{answer.question.text}</span>
                        <span className="mt-1 block text-xs text-muted-foreground">{answer.question.competency}</span>
                      </span>
                      <span className="font-heading text-xl font-semibold text-primary">{answer.score.overall}</span>
                      {expanded === index ? <ChevronUp className="mt-1 size-4" /> : <ChevronDown className="mt-1 size-4" />}
                    </button>
                    {expanded === index && (
                      <CardContent className="border-t border-border px-5 py-4">
                        <p className="text-sm leading-6 text-muted-foreground">“{answer.transcript}”</p>
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                          <div className="rounded-lg bg-secondary/55 p-2">
                            <p className="font-semibold">{answer.score.metrics.wordsPerMinute}</p>
                            <p className="text-[9px] uppercase">words/min</p>
                          </div>
                          <div className="rounded-lg bg-secondary/55 p-2">
                            <p className="font-semibold">{answer.score.metrics.fillerCount}</p>
                            <p className="text-[9px] uppercase">fillers</p>
                          </div>
                          <div className="rounded-lg bg-secondary/55 p-2">
                            <p className="font-semibold">{answer.score.metrics.pauseCount}</p>
                            <p className="text-[9px] uppercase">pauses</p>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          </section>

          <aside className="space-y-4">
            <Card className="border-emerald-800/15 bg-emerald-50 py-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-emerald-900">
                  <Sparkles className="size-4" />
                  <h2 className="font-semibold">What worked</h2>
                </div>
                <ul className="mt-4 space-y-3">
                  {report.strengths.map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-5 text-emerald-950">
                      <Check className="mt-0.5 size-4 shrink-0" /> {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <Card className="border-primary/15 bg-primary/5 py-0">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 text-primary">
                  <GraduationCap className="size-4" />
                  <h2 className="font-semibold">Next practice</h2>
                </div>
                <ol className="mt-4 space-y-3">
                  {report.improvements.map((item, index) => (
                    <li key={item} className="flex gap-3 text-sm leading-5">
                      <span className="font-mono text-xs font-bold text-primary">0{index + 1}</span>
                      {item}
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
            <div className="rounded-xl border border-border p-4 text-xs leading-5 text-muted-foreground">
              <LockKeyhole className="mb-2 size-4 text-primary" />
              This report was calculated in your browser. Garuda did not upload your resume,
              transcript, or score.
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export function GarudaApp() {
  const [screen, setScreen] = useState<Screen>("home");
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [role, setRole] = useState<InterviewRole>("software-engineer");
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);

  useEffect(() => {
    setSessions(readSessionHistory());
  }, []);

  const startInterview = useCallback((candidate: CandidateProfile, selectedRole: InterviewRole) => {
    setProfile(candidate);
    setRole(selectedRole);
    setReport(null);
    setScreen("interview");
    window.scrollTo(0, 0);
  }, []);

  const finishInterview = useCallback((answers: InterviewAnswer[]) => {
    const nextReport = createReport(answers);
    setReport(nextReport);
    if (profile) {
      const summary = createSessionSummary(nextReport, profile.name, role);
      setSessions(saveSessionSummary(summary));
    }
    setScreen("report");
    window.scrollTo(0, 0);
  }, [profile, role]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {screen === "home" && (
          <HomeScreen
            onStart={() => setScreen("setup")}
            onHistory={() => setScreen("history")}
            sessionCount={sessions.length}
          />
        )}
        {screen === "setup" && <SetupScreen onBack={() => setScreen("home")} onStart={startInterview} />}
        {screen === "interview" && profile && (
          <InterviewScreen
            profile={profile}
            role={role}
            onFinish={finishInterview}
            onExit={() => setScreen("setup")}
          />
        )}
        {screen === "report" && profile && report && (
          <ReportScreen
            profile={profile}
            role={role}
            report={report}
            onRestart={() => setScreen("setup")}
          />
        )}
        {screen === "history" && (
          <HistoryScreen
            sessions={sessions}
            onBack={() => setScreen("home")}
            onStart={() => setScreen("setup")}
            onClear={() => {
              clearSessionHistory();
              setSessions([]);
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}
