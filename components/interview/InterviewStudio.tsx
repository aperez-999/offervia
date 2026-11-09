"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Lightbulb,
  Loader2,
  MessageSquare,
  Play,
  RotateCcw,
  Target,
  TrendingUp,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Reveal } from "@/components/motion/Reveal";
import { DAILY_LIMITS } from "@/lib/usage/limits";
import {
  DIFFICULTY_OPTIONS,
  FOCUS_OPTIONS,
  difficultyLabel,
  focusLabel,
  QUESTION_COUNT,
  scoreBand,
  type AnswerFeedback,
  type InterviewDifficulty,
  type InterviewFocus,
  type TranscriptEntry,
} from "@/lib/interview/config";

type Phase = "setup" | "active" | "summary";

const toneToClasses: Record<
  ReturnType<typeof scoreBand>["tone"],
  { ring: string; text: string; chip: string }
> = {
  reward: { ring: "text-reward", text: "text-reward", chip: "bg-reward/10 text-reward border-reward/30" },
  primary: { ring: "text-primary", text: "text-primary", chip: "bg-primary/10 text-primary border-primary/30" },
  amber: { ring: "text-amber-500", text: "text-amber-500", chip: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
  muted: { ring: "text-foreground/50", text: "text-foreground/60", chip: "bg-foreground/5 text-foreground/60 border-border" },
};

function ScoreRing({ score, size = 132 }: { score: number; size?: number }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const band = scoreBand(score);
  const tone = toneToClasses[band.tone];
  const reduce = useReducedMotion();

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-border"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeLinecap="round"
          className={tone.ring}
          strokeDasharray={circ}
          initial={{ strokeDashoffset: reduce ? circ - (score / 100) * circ : circ }}
          animate={{ strokeDashoffset: circ - (score / 100) * circ }}
          transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${tone.text}`}>{score}</span>
        <span className="text-xs font-medium text-foreground/60">{band.label}</span>
      </div>
    </div>
  );
}

function SegmentGroup<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string; hint: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            aria-pressed={active}
            className={[
              "rounded-lg border px-4 py-3 text-left transition-all",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              "disabled:cursor-not-allowed disabled:opacity-50",
              active
                ? "border-primary bg-primary/5 shadow-[0_0_0_1px_var(--color-primary)]"
                : "border-border bg-card hover:border-primary/40 hover:bg-primary/5",
            ].join(" ")}
          >
            <div className="text-sm font-semibold text-foreground">{opt.label}</div>
            <div className="mt-0.5 text-xs text-foreground/60">{opt.hint}</div>
          </button>
        );
      })}
    </div>
  );
}

function FeedbackCard({ feedback }: { feedback: AnswerFeedback }) {
  const band = scoreBand(feedback.score);
  const tone = toneToClasses[band.tone];
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold text-foreground">Feedback</div>
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${tone.chip}`}>
          {feedback.score}/100 · {band.label}
        </span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/60">
            <CheckCircle2 className="size-3.5 text-primary" /> Strengths
          </div>
          <ul className="mt-2 space-y-1.5">
            {feedback.strengths.length ? (
              feedback.strengths.map((s, i) => (
                <li key={i} className="text-sm text-foreground/80">• {s}</li>
              ))
            ) : (
              <li className="text-sm text-foreground/50">None noted</li>
            )}
          </ul>
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/60">
            <TrendingUp className="size-3.5 text-amber-500" /> To improve
          </div>
          <ul className="mt-2 space-y-1.5">
            {feedback.improvements.length ? (
              feedback.improvements.map((s, i) => (
                <li key={i} className="text-sm text-foreground/80">• {s}</li>
              ))
            ) : (
              <li className="text-sm text-foreground/50">None noted</li>
            )}
          </ul>
        </div>
      </div>
      {feedback.tip ? (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-sm text-foreground/80">{feedback.tip}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function InterviewStudio({ defaultRole = "" }: { defaultRole?: string }) {
  const { toast } = useToast();

  const [phase, setPhase] = useState<Phase>("setup");
  const [roleTitle, setRoleTitle] = useState(defaultRole);
  const [focus, setFocus] = useState<InterviewFocus>("mixed");
  const [difficulty, setDifficulty] = useState<InterviewDifficulty>("standard");

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [transcript, setTranscript] = useState<(TranscriptEntry | undefined)[]>([]);

  const [starting, setStarting] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [limitReached, setLimitReached] = useState(false);

  const [overallScore, setOverallScore] = useState(0);
  const [summary, setSummary] = useState("");

  const limit = DAILY_LIMITS.interview_session;
  const currentFeedback = transcript[index];
  const answeredCount = useMemo(() => transcript.filter(Boolean).length, [transcript]);

  async function postInterview(payload: Record<string, unknown>) {
    const res = await fetch("/api/interview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data } as { res: Response; data: Record<string, unknown> };
  }

  async function handleStart() {
    if (roleTitle.trim().length < 2) {
      toast({ title: "Add a target role", description: "Enter the role you're interviewing for.", variant: "destructive" });
      return;
    }
    setStarting(true);
    setLimitReached(false);
    try {
      const { res, data } = await postInterview({ action: "start", roleTitle: roleTitle.trim(), focus, difficulty });
      if (data.error === "DAILY_LIMIT_REACHED") {
        setLimitReached(true);
        return;
      }
      if (!res.ok) {
        toast({ title: "Couldn't start", description: String(data.message || "Try again in a moment."), variant: "destructive" });
        return;
      }
      const qs = (data.questions as string[]) || [];
      setSessionId(String(data.sessionId));
      setQuestions(qs);
      setTranscript(new Array(qs.length).fill(undefined));
      setIndex(0);
      setAnswer("");
      setPhase("active");
    } catch {
      toast({ title: "Network error", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setStarting(false);
    }
  }

  async function handleSubmitAnswer() {
    if (!sessionId || answer.trim().length < 1) return;
    setScoring(true);
    try {
      const { res, data } = await postInterview({
        action: "answer",
        sessionId,
        questionIndex: index,
        answer: answer.trim(),
      });
      if (!res.ok) {
        toast({ title: "Couldn't score", description: String(data.message || "Try again in a moment."), variant: "destructive" });
        return;
      }
      const feedback = data.feedback as TranscriptEntry;
      setTranscript((prev) => {
        const next = [...prev];
        next[index] = feedback;
        return next;
      });
    } catch {
      toast({ title: "Network error", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setScoring(false);
    }
  }

  function handleNext() {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      setAnswer("");
    }
  }

  async function handleFinish() {
    if (!sessionId) return;
    setFinishing(true);
    try {
      const { res, data } = await postInterview({ action: "finish", sessionId });
      if (!res.ok) {
        toast({ title: "Couldn't finish", description: String(data.message || "Try again in a moment."), variant: "destructive" });
        return;
      }
      setOverallScore(Number(data.overallScore) || 0);
      setSummary(String(data.summary || ""));
      setPhase("summary");
    } catch {
      toast({ title: "Network error", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setFinishing(false);
    }
  }

  function handleReset() {
    setPhase("setup");
    setSessionId(null);
    setQuestions([]);
    setIndex(0);
    setAnswer("");
    setTranscript([]);
    setOverallScore(0);
    setSummary("");
    setLimitReached(false);
  }

  // ---- SETUP ----
  if (phase === "setup") {
    return (
      <Reveal className="mx-auto w-full max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border bg-brand-gradient/[0.03] px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Target className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Set up your mock interview</h2>
                <p className="text-sm text-foreground/70">You&apos;ll get {QUESTION_COUNT} questions for this role. Each answer is scored out of 100.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8">
            {limitReached ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                <p className="text-sm font-medium text-foreground">
                  You&apos;ve used today&apos;s {limit} mock interviews. More open up within 24 hours.
                </p>
              </div>
            ) : null}

            <div className="space-y-2">
              <label htmlFor="roleTitle" className="text-sm font-medium text-foreground">Target role</label>
              <Input
                id="roleTitle"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                maxLength={120}
                disabled={starting}
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Focus</span>
              <SegmentGroup options={FOCUS_OPTIONS} value={focus} onChange={setFocus} disabled={starting} />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium text-foreground">Difficulty</span>
              <SegmentGroup options={DIFFICULTY_OPTIONS} value={difficulty} onChange={setDifficulty} disabled={starting} />
            </div>

            <div className="flex flex-col-reverse items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-foreground/60">
                Up to {limit} mock interviews a day
              </p>
              <Button onClick={handleStart} disabled={starting} size="lg" className="sm:min-w-44">
                {starting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Writing your questions…
                  </>
                ) : (
                  <>
                    <Play className="size-4" /> Start interview
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </Reveal>
    );
  }

  // ---- ACTIVE ----
  if (phase === "active") {
    const total = questions.length;
    const pct = Math.round(((index + (currentFeedback ? 1 : 0)) / total) * 100);
    const isLast = index === total - 1;
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">
              Question {index + 1} <span className="text-foreground/50">of {total}</span>
            </span>
            <span className="text-foreground/60">{focusLabel(focus)} · {difficultyLabel(difficulty)}</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-border">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-border bg-card p-6 sm:p-7"
          >
            <div className="flex items-start gap-3">
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                {index + 1}
              </span>
              <p className="text-lg font-medium leading-relaxed text-foreground">{questions[index]}</p>
            </div>

            <div className="mt-5 space-y-2">
              <Textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Say your answer out loud first, then type the main points here…"
                rows={7}
                maxLength={4000}
                disabled={scoring || Boolean(currentFeedback)}
                className="resize-none"
              />
              <div className="flex items-center justify-between text-xs text-foreground/50">
                <span>{currentFeedback ? "Answer submitted" : "Give a specific example. Situation, task, action, result works well."}</span>
                <span>{answer.length}/4000</span>
              </div>
            </div>

            {!currentFeedback ? (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleSubmitAnswer} disabled={scoring || answer.trim().length < 1}>
                  {scoring ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Scoring your answer…
                    </>
                  ) : (
                    <>Submit answer</>
                  )}
                </Button>
              </div>
            ) : null}
          </motion.div>
        </AnimatePresence>

        <AnimatePresence>
          {currentFeedback ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              <FeedbackCard feedback={currentFeedback} />
              <div className="flex justify-end">
                {isLast ? (
                  <Button onClick={handleFinish} disabled={finishing} size="lg">
                    {finishing ? (
                      <>
                        <Loader2 className="size-4 animate-spin" /> Writing your summary…
                      </>
                    ) : (
                      <>See results <ArrowRight className="size-4" /></>
                    )}
                  </Button>
                ) : (
                  <Button onClick={handleNext} size="lg">
                    Next question <ArrowRight className="size-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }

  // ---- SUMMARY ----
  const answered = transcript.filter(Boolean) as TranscriptEntry[];
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <Reveal>
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex flex-col items-center gap-4 border-b border-border px-6 py-8 text-center sm:px-8">
            <ScoreRing score={overallScore} />
            <div>
              <h2 className="text-xl font-semibold text-foreground">{roleTitle || "Mock interview"}: finished</h2>
              <p className="mt-1 text-sm text-foreground/70">
                {answeredCount} of {questions.length} answered · {focusLabel(focus)} · {difficultyLabel(difficulty)}
              </p>
            </div>
            {summary ? (
              <p className="max-w-xl text-sm leading-relaxed text-foreground/80">{summary}</p>
            ) : null}
          </div>

          <div className="space-y-3 px-6 py-6 sm:px-8">
            <div className="text-xs font-semibold text-foreground/60">Scores by question</div>
            {answered.map((t, i) => {
              const band = scoreBand(t.score);
              const tone = toneToClasses[band.tone];
              return (
                <Reveal key={i} index={i} className="rounded-xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-foreground">{t.question}</p>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-semibold ${tone.chip}`}>
                      {t.score}
                    </span>
                  </div>
                  {t.improvements.length ? (
                    <p className="mt-2 text-xs text-foreground/60">
                      <span className="font-semibold text-foreground/70">Fix next: </span>
                      {t.improvements[0]}
                    </p>
                  ) : null}
                </Reveal>
              );
            })}
          </div>
        </div>
      </Reveal>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button onClick={handleReset} size="lg" variant="outline">
          <RotateCcw className="size-4" /> New interview
        </Button>
        <Button asChild size="lg">
          <Link href="/coach">
            <MessageSquare className="size-4" /> Practice more with Coach
          </Link>
        </Button>
      </div>
    </div>
  );
}
