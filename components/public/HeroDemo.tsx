"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FileText,
  Sparkles,
  Mail,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Bot,
  Check,
} from "lucide-react";

/**
 * Interactive product demo — a hand-built, token-driven mock of the Offervia
 * workflow. A self-driving cursor clicks through five real features:
 * Scanner → Resume Tailor → Cover Letter → Interview Coach → Tracker.
 * No video: real DOM. Dark/light compatible, reduced-motion safe.
 */

type Step = {
  key: string;
  label: string;
  url: string;
  icon: typeof FileText;
};

const STEPS: Step[] = [
  { key: "scan", label: "Scan", url: "scanner", icon: FileText },
  { key: "tailor", label: "Tailor", url: "resume", icon: Sparkles },
  { key: "cover", label: "Cover", url: "cover-letter", icon: Mail },
  { key: "coach", label: "Coach", url: "coach", icon: MessageSquare },
  { key: "track", label: "Track", url: "tracker", icon: CheckCircle2 },
];

const DWELL = 2100;
const TRAVEL = 620;
const CLICK = 280;
const CYCLE = DWELL + TRAVEL + CLICK;

const KEYWORDS = ["React", "TypeScript", "REST APIs", "CI/CD", "Agile"];

const BULLETS = [
  {
    before: "Worked on the frontend for a web app.",
    after: "Shipped 10+ React + TypeScript features, cutting load time 20%.",
  },
  {
    before: "Helped with the team's projects.",
    after: "Led REST API integration across 3 services in Agile sprints.",
  },
];

export default function HeroDemo() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);
  const [clicking, setClicking] = useState(false);

  const frameRef = useRef<HTMLDivElement | null>(null);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const coordsFor = useCallback((i: number) => {
    const btn = btnRefs.current[i];
    const frame = frameRef.current;
    if (!btn || !frame) return null;
    const b = btn.getBoundingClientRect();
    const f = frame.getBoundingClientRect();
    return { x: b.left - f.left + b.width / 2 - 3, y: b.top - f.top + b.height / 2 - 2 };
  }, []);

  // Rest the cursor on the active tab once layout is measurable.
  useEffect(() => {
    if (reduce) return;
    const id = requestAnimationFrame(() => setCursor(coordsFor(step)));
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduce]);

  // Self-driving loop: dwell → glide cursor to next tab → click → advance.
  useEffect(() => {
    if (reduce) {
      setStep(4);
      return;
    }
    if (paused) return;
    let t2: ReturnType<typeof setTimeout>;
    let t3: ReturnType<typeof setTimeout>;
    const t1 = setTimeout(() => {
      const next = (step + 1) % STEPS.length;
      const pos = coordsFor(next);
      if (pos) setCursor(pos);
      t2 = setTimeout(() => {
        setClicking(true);
        t3 = setTimeout(() => {
          setClicking(false);
          setStep(next);
        }, CLICK);
      }, TRAVEL);
    }, DWELL);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [step, paused, reduce, coordsFor]);

  const goTo = (i: number) => {
    setStep(i);
    const pos = coordsFor(i);
    if (pos) setCursor(pos);
  };

  return (
    <div
      ref={frameRef}
      className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/5 dark:shadow-black/40"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Self-driving cursor overlay */}
      {!reduce && cursor && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 z-20"
          animate={{ x: cursor.x, y: cursor.y }}
          transition={{ duration: TRAVEL / 1000, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            animate={clicking ? { scale: 0.82 } : { scale: 1 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className="relative"
          >
            <AnimatePresence>
              {clicking && (
                <motion.span
                  key="ripple"
                  initial={{ scale: 0.4, opacity: 0.5 }}
                  animate={{ scale: 2.4, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="absolute -left-1 -top-1 h-6 w-6 rounded-full bg-primary/30"
                />
              )}
            </AnimatePresence>
            <svg width="20" height="20" viewBox="0 0 24 24" className="drop-shadow-md">
              <path
                d="M5 3l14 7-6 2.2L10 19 5 3z"
                fill="var(--foreground)"
                stroke="var(--background)"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        </motion.div>
      )}

      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-destructive/70" />
          <span className="h-3 w-3 rounded-full bg-warning/70" />
          <span className="h-3 w-3 rounded-full bg-success/70" />
        </div>
        <div className="mx-auto flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success" />
          offervia.app/{STEPS[step].url}
        </div>
        <span className="hidden items-center gap-1.5 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary sm:inline-flex">
          <span className="relative flex h-1.5 w-1.5">
            {!reduce && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            )}
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          Live demo
        </span>
      </div>

      {/* Step rail */}
      <div className="flex items-center gap-1 border-b border-border bg-background px-3 py-2">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const active = i === step;
          const done = i < step;
          return (
            <button
              key={s.key}
              type="button"
              ref={(el) => {
                btnRefs.current[i] = el;
              }}
              onClick={() => goTo(i)}
              aria-current={active ? "step" : undefined}
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors pointer-coarse:min-h-11",
                active
                  ? "bg-primary/10 text-primary"
                  : done
                    ? "text-foreground/70 hover:bg-muted"
                    : "text-muted-foreground hover:bg-muted",
              ].join(" ")}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Stage */}
      <div className="relative min-h-[320px] bg-background p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
            {step === 0 && <ScanPane reduce={!!reduce} />}
            {step === 1 && <TailorPane reduce={!!reduce} />}
            {step === 2 && <CoverPane reduce={!!reduce} />}
            {step === 3 && <CoachPane reduce={!!reduce} />}
            {step === 4 && <TrackPane reduce={!!reduce} />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress ticks */}
      <div className="flex gap-1 px-5 pb-4">
        {STEPS.map((s, i) => (
          <div key={s.key} className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={false}
              animate={{ width: i < step ? "100%" : i === step ? "100%" : "0%" }}
              transition={{
                duration: i === step && !paused && !reduce ? CYCLE / 1000 : 0.3,
                ease: "linear",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function PaneHead({
  icon: Icon,
  title,
  sub,
  badge,
}: {
  icon: typeof FileText;
  title: string;
  sub: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{sub}</p>
        </div>
      </div>
      {badge}
    </div>
  );
}

function ScanPane({ reduce }: { reduce: boolean }) {
  const [score, setScore] = useState(reduce ? 92 : 0);
  useEffect(() => {
    if (reduce) return;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min((t - start) / 1100, 1);
      setScore(Math.round(92 * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  return (
    <div>
      <PaneHead
        icon={FileText}
        title="Job Description Scanner"
        sub="Extract requirements and score your fit"
      />
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        <div className="rounded-xl border border-border bg-muted/30 p-4">
          <p className="mb-2.5 text-xs font-medium text-foreground">Senior Frontend Engineer</p>
          <div className="space-y-2">
            {[96, 82, 88, 70].map((w, i) => (
              <div
                key={i}
                className="h-2.5 rounded-full bg-foreground/10"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4 sm:flex-col sm:gap-2">
          <div className="relative grid h-24 w-24 shrink-0 place-items-center">
            <svg viewBox="0 0 100 100" className="h-24 w-24 -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--muted)" strokeWidth="8" />
              <circle
                cx="50"
                cy="50"
                r="42"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 42}
                strokeDashoffset={2 * Math.PI * 42 * (1 - score / 100)}
              />
            </svg>
            <span className="absolute text-xl font-bold text-foreground tabular-nums">
              {score}%
            </span>
          </div>
          <p className="text-xs font-medium text-success sm:text-center">Strong match</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {KEYWORDS.map((k, i) => (
          <motion.span
            key={k}
            initial={reduce ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: reduce ? 0 : 0.5 + i * 0.1 }}
            className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
          >
            <Check className="h-3 w-3" />
            {k}
          </motion.span>
        ))}
      </div>
    </div>
  );
}

function TailorPane({ reduce }: { reduce: boolean }) {
  return (
    <div>
      <PaneHead
        icon={Sparkles}
        title="Resume Tailor"
        sub="Rewrite bullets to match the role"
        badge={
          <span className="inline-flex items-center gap-1 rounded-full border border-success/30 bg-success/10 px-2 py-1 text-[11px] font-medium text-success">
            <ShieldCheck className="h-3 w-3" />
            ATS-ready · 94
          </span>
        }
      />
      <div className="space-y-2.5">
        {BULLETS.map((b, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground line-through">{b.before}</p>
                <motion.p
                  initial={reduce ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: reduce ? 0 : 0.3 + i * 0.35, duration: 0.4 }}
                  className="mt-1 text-sm font-medium text-foreground"
                >
                  {b.after}
                </motion.p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoverPane({ reduce }: { reduce: boolean }) {
  const lines = [
    "Dear Hiring Manager,",
    "I'm excited to apply for the Senior Frontend Engineer role at Northwind Labs.",
    "My work shipping React + TypeScript features maps directly to your team's goals.",
  ];
  return (
    <div>
      <PaneHead
        icon={Mail}
        title="Cover Letter"
        sub="Personalized to the company and role"
        badge={
          <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">
            <Sparkles className="h-3 w-3" />
            Tailored
          </span>
        }
      />
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="space-y-2.5">
          {lines.map((l, i) => (
            <motion.p
              key={i}
              initial={reduce ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduce ? 0 : i * 0.45, duration: 0.4 }}
              className={
                i === 0 ? "text-sm font-medium text-foreground" : "text-sm text-foreground/80"
              }
            >
              {l}
            </motion.p>
          ))}
          <div className="space-y-2 pt-1">
            <div className="h-2.5 w-[88%] rounded-full bg-foreground/10" />
            <div className="h-2.5 w-[72%] rounded-full bg-foreground/10" />
          </div>
          <motion.p
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: reduce ? 0 : 1.5 }}
            className="pt-1 text-sm text-foreground/80"
          >
            Best,
            <br />
            Jordan Rivera
          </motion.p>
        </div>
      </div>
    </div>
  );
}

function CoachPane({ reduce }: { reduce: boolean }) {
  return (
    <div>
      <PaneHead
        icon={MessageSquare}
        title="AI Interview Coach"
        sub="Practice answers with instant feedback"
        badge={
          <span className="inline-flex items-center gap-1 rounded-full border border-info/30 bg-info/10 px-2 py-1 text-[11px] font-medium text-info">
            STAR method
          </span>
        }
      />
      <div className="space-y-3">
        <div className="flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
            How do I answer &ldquo;tell me about a challenge you solved&rdquo;?
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20">
            <Bot className="h-4 w-4" />
          </span>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.6, duration: 0.4 }}
            className="max-w-[80%] rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5 text-sm text-foreground/90"
          >
            Start with the <span className="font-medium text-foreground">Situation</span>, name the{" "}
            <span className="font-medium text-foreground">Task</span>, then walk through your{" "}
            <span className="font-medium text-foreground">Action</span> and the measurable{" "}
            <span className="font-medium text-foreground">Result</span>.
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function TrackPane({ reduce }: { reduce: boolean }) {
  const cols = [
    { key: "applied", label: "Applied", tint: "var(--status-applied)", count: 8 },
    { key: "interviewing", label: "Interviewing", tint: "var(--status-interviewing)", count: 4 },
    { key: "offer", label: "Offer", tint: "var(--status-offer)", count: 1 },
  ];
  return (
    <div>
      <PaneHead
        icon={CheckCircle2}
        title="Application Tracker"
        sub="Every application and follow-up in one board"
        badge={
          <span className="rounded-full border border-border bg-muted/50 px-2 py-1 text-[11px] font-medium text-muted-foreground">
            13 active
          </span>
        }
      />
      <div className="grid grid-cols-3 gap-2">
        {cols.map((c) => (
          <div key={c.key} className="rounded-xl border border-border bg-muted/30 p-2">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: c.tint }} />
                <span className="text-[11px] font-medium text-muted-foreground">{c.label}</span>
              </span>
              <span className="text-[10px] font-semibold text-muted-foreground">{c.count}</span>
            </div>
            {c.key === "interviewing" ? (
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 240, damping: 22, delay: reduce ? 0 : 0.2 }}
                className="rounded-lg border border-border bg-card p-2.5 shadow-sm"
              >
                <p className="text-xs font-semibold text-foreground">Frontend Engineer</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">Northwind Labs</p>
                <span
                  className="mt-2 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                  style={{
                    background: "color-mix(in oklab, var(--status-interviewing) 14%, transparent)",
                    color: "var(--status-interviewing)",
                  }}
                >
                  <CheckCircle2 className="h-3 w-3" />
                  Interview set
                </span>
              </motion.div>
            ) : (
              <div className="space-y-1.5 rounded-lg border border-border bg-card p-2.5">
                <div className="h-2 w-[80%] rounded-full bg-foreground/10" />
                <div className="h-2 w-[55%] rounded-full bg-foreground/10" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
