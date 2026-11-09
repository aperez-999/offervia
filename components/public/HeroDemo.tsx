"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { CalendarDots, Check, X } from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * The homepage demo: the whole idea in three panels you can read at a glance.
 * A track across the top fills as it moves from step to step. Every panel has
 * a fixed height (the before and after states share one grid cell), so the
 * page never shifts while it plays. It loops while on screen and holds the
 * finished state when reduced motion is on.
 */

const SKILLS = ["React", "TypeScript", "REST APIs", "CI/CD", "Agile"];
const MISSING = "CI/CD";
const STEPS = ["Paste a job posting", "See what your resume is missing", "Fix it before you apply"];

const POSTING: Array<string | number> = [
  "Build our customer dashboard in ",
  0,
  " and ",
  1,
  ", ship features on ",
  2,
  ", own ",
  3,
  ", and work in an ",
  4,
  " team.",
];

// When each stage starts within one loop, and how long a loop lasts (ms).
const STAGE_AT = [0, 600, 2600, 4600];
const LOOP_MS = 9400;
const ease = [0.22, 1, 0.36, 1] as const;

/** Two states in one grid cell: the cell is always as tall as the taller one. */
function Swap({ show, a, b, className }: { show: "a" | "b"; a: React.ReactNode; b: React.ReactNode; className?: string }) {
  const layer = "col-start-1 row-start-1 transition-[opacity,transform,filter] duration-500 ease-[var(--ease-out-quint)]";
  return (
    <div className={cn("grid", className)}>
      <div className={cn(layer, show === "a" ? "opacity-100" : "pointer-events-none -translate-y-1 opacity-0")} aria-hidden={show !== "a"}>
        {a}
      </div>
      <div
        className={cn(layer, show === "b" ? "opacity-100 blur-0" : "pointer-events-none translate-y-1.5 opacity-0 blur-[2px]")}
        aria-hidden={show !== "b"}
      >
        {b}
      </div>
    </div>
  );
}

function MatchRing({ value, label }: { value: number; label: string }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid size-[76px] shrink-0 place-items-center">
      <svg viewBox="0 0 76 76" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="38" cy="38" r={r} fill="none" stroke="var(--muted)" strokeWidth="7" />
        <motion.circle
          cx="38"
          cy="38"
          r={r}
          fill="none"
          stroke={value >= 1 ? "var(--reward)" : "var(--primary)"}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c * (1 - value) }}
          transition={{ duration: 0.9, ease }}
        />
      </svg>
      <span className="font-display text-lg font-bold tabular-nums text-foreground">{label}</span>
    </div>
  );
}

export default function HeroDemo() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.3 });
  // 0: nothing marked yet, 1: skills found, 2: gap shown, 3: bullet fixed.
  const [stage, setStage] = useState(0);
  // Bumped each loop so the highlighter swipes play again.
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (reduce) {
      setStage(3);
      return;
    }
    if (!inView) return;
    setStage(0);
    const timers = STAGE_AT.slice(1).map((at, i) => window.setTimeout(() => setStage(i + 1), at));
    timers.push(window.setTimeout(() => setRun((r) => r + 1), LOOP_MS));
    return () => timers.forEach(window.clearTimeout);
  }, [inView, reduce, run]);

  const fixed = stage >= 3;
  const gap = stage >= 2;
  // Track fill reaches the centre of the current step's column.
  const fill = stage === 0 ? 0 : (stage * 2 - 1) / 6;

  return (
    <div ref={ref} role="group" aria-label="How Offervia works, in three steps">
      {/* Progress track (desktop) */}
      <div aria-hidden className="relative mb-5 hidden lg:block">
        <div className="absolute inset-x-[16.66%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-border" />
        <motion.div
          className="absolute left-[16.66%] top-1/2 h-1 -translate-y-1/2 rounded-full bg-highlight"
          initial={false}
          animate={{ width: `${Math.max(0, fill - 1 / 6) * 100}%` }}
          transition={{ duration: 0.8, ease }}
        />
        <ol className="relative grid grid-cols-3">
          {STEPS.map((s, i) => {
            const done = stage >= i + 1;
            return (
              <li key={s} className="flex justify-center">
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-full border-2 font-display text-sm font-bold transition-colors duration-500",
                    done
                      ? "border-primary-button bg-primary-button text-primary-button-foreground"
                      : "border-border bg-background text-muted-foreground"
                  )}
                >
                  {i + 1}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 1. The posting */}
        <section className="flex flex-col rounded-3xl border border-border bg-card p-6">
          <StepTitle n={1} active={stage === 1} />
          <div className="mt-5 flex-1 rounded-2xl border border-border bg-background/60 p-4">
            <div className="flex items-center gap-3">
              <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-primary-button font-display text-sm font-bold text-primary-button-foreground">
                B
              </span>
              <div className="min-w-0 leading-tight">
                <p className="truncate text-sm font-semibold text-foreground">Frontend Engineer</p>
                <p className="truncate text-xs text-muted-foreground">Brightline · Remote</p>
              </div>
            </div>
            <p key={`posting-${run}`} className="mt-3 text-[15px] leading-relaxed text-foreground/85">
              {POSTING.map((part, i) =>
                typeof part === "string" ? (
                  <span key={i}>{part}</span>
                ) : stage >= 1 ? (
                  <span key={i} className="hl" style={{ "--hl-delay": `${part * 150}ms` } as React.CSSProperties}>
                    {SKILLS[part]}
                  </span>
                ) : (
                  <span key={i}>{SKILLS[part]}</span>
                )
              )}
            </p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Offervia finds the 5 skills it asks for.</p>
        </section>

        {/* 2. The gap */}
        <section className="flex flex-col rounded-3xl border border-border bg-card p-6">
          <StepTitle n={2} active={stage === 2} />
          <div className="mt-5 flex flex-1 flex-col rounded-2xl border border-border bg-background/60 p-4">
            <div className="flex items-center gap-4">
              <MatchRing value={fixed ? 1 : gap ? 0.8 : 0} label={fixed ? "5/5" : gap ? "4/5" : "–/5"} />
              <Swap
                show={fixed ? "b" : "a"}
                className="text-sm"
                a={
                  <p className="text-foreground/80">
                    <span className="font-semibold text-foreground">Missing {MISSING}.</span> Screening software looks for it.
                  </p>
                }
                b={
                  <p className="text-foreground/80">
                    <span className="font-semibold text-reward">All 5 covered.</span> Your resume matches what they want.
                  </p>
                }
              />
            </div>
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Skills">
              {SKILLS.map((s) => {
                const missing = s === MISSING && !fixed;
                return (
                  <li
                    key={s}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[13px] font-medium transition-[background-color,border-color,opacity,color] duration-500",
                      !gap && "opacity-40",
                      missing ? "border border-dashed border-warning bg-warning/10 text-foreground" : "hl-soft border border-transparent"
                    )}
                  >
                    {missing ? <X className="size-3.5 text-warning" weight="bold" aria-hidden /> : <Check className="size-3.5" weight="bold" aria-hidden />}
                    {s}
                    {missing ? <span className="sr-only"> (missing)</span> : null}
                  </li>
                );
              })}
            </ul>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Compared against your saved resume.</p>
        </section>

        {/* 3. The fix */}
        <section className="flex flex-col rounded-3xl border border-border bg-card p-6">
          <StepTitle n={3} active={stage === 3} />
          <div className="mt-5 flex flex-1 flex-col gap-3 rounded-2xl border border-border bg-background/60 p-4 text-[15px] leading-relaxed">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Before</p>
              <p className={cn("mt-1 transition-[color,opacity] duration-500", fixed ? "text-muted-foreground line-through opacity-70" : "text-foreground/85")}>
                Helped with deployments.
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">After</p>
              <Swap
                show={fixed ? "b" : "a"}
                className="mt-1"
                a={
                  <p className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                    A stronger bullet with the missing skill goes here.
                  </p>
                }
                b={
                  <p key={`after-${run}`} className="text-foreground">
                    Set up{" "}
                    {fixed ? (
                      <span className="hl" style={{ "--hl-delay": "300ms" } as React.CSSProperties}>
                        CI/CD
                      </span>
                    ) : (
                      "CI/CD"
                    )}{" "}
                    with GitHub Actions, cutting release time from a day to 20 minutes.
                  </p>
                }
              />
            </div>
          </div>
          <p
            className={cn(
              "mt-4 inline-flex items-center gap-1.5 text-sm transition-colors duration-500",
              fixed ? "text-foreground/80" : "text-muted-foreground"
            )}
          >
            <CalendarDots className="size-4" aria-hidden />
            Then track it and follow up in a week.
          </p>
        </section>
      </div>
    </div>
  );
}

function StepTitle({ n, active }: { n: number; active: boolean }) {
  return (
    <h3 className="flex items-start gap-2.5 font-display text-lg font-semibold leading-snug text-foreground">
      <span
        className={cn(
          "mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors duration-500 lg:hidden",
          active ? "bg-primary-button text-primary-button-foreground" : "bg-muted text-muted-foreground"
        )}
      >
        {n}
      </span>
      <span className="relative">
        {STEPS[n - 1]}
        <span
          aria-hidden
          className={cn(
            "absolute -bottom-1 left-0 h-0.5 w-full origin-left rounded-full bg-primary transition-transform duration-500 ease-[var(--ease-out-quint)]",
            active ? "scale-x-100" : "scale-x-0"
          )}
        />
      </span>
    </h3>
  );
}
