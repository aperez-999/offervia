"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CheckCircle2,
  ChevronDown,
  History,
  Lightbulb,
  TrendingUp,
} from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import {
  difficultyLabel,
  focusLabel,
  scoreBand,
  type PastInterview,
} from "@/lib/interview/config";

const toneChip: Record<ReturnType<typeof scoreBand>["tone"], string> = {
  reward: "bg-reward/10 text-reward border-reward/30",
  primary: "bg-primary/10 text-primary border-primary/30",
  amber: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  muted: "bg-foreground/5 text-foreground/60 border-border",
};

const toneBar: Record<ReturnType<typeof scoreBand>["tone"], string> = {
  reward: "bg-reward",
  primary: "bg-primary",
  amber: "bg-amber-500",
  muted: "bg-foreground/30",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export default function InterviewHistory({
  sessions,
}: {
  sessions: PastInterview[];
}) {
  const reduceMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(null);

  const trend = useMemo(() => {
    // oldest -> newest, last 8, for a simple progress read
    return [...sessions]
      .slice(0, 8)
      .reverse()
      .map((s) => ({ id: s.id, score: s.overallScore }));
  }, [sessions]);

  const average = useMemo(() => {
    if (!sessions.length) return 0;
    const sum = sessions.reduce((acc, s) => acc + s.overallScore, 0);
    return Math.round(sum / sessions.length);
  }, [sessions]);

  if (!sessions.length) return null;

  const avgBand = scoreBand(average);

  return (
    <Reveal className="mt-8">
      <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background/60 text-primary">
              <History className="size-5" />
            </span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Past sessions
              </h2>
              <p className="text-sm text-foreground/60">
                {sessions.length} completed · average{" "}
                <span className={`font-semibold ${toneChip[avgBand.tone].split(" ")[1]}`}>
                  {average}/100
                </span>
              </p>
            </div>
          </div>

          {trend.length > 1 ? (
            <div
              className="flex items-end gap-1.5"
              aria-hidden
              title="Recent score trend (oldest to newest)"
            >
              {trend.map((t) => {
                const band = scoreBand(t.score);
                return (
                  <div
                    key={t.id}
                    className={`w-2 rounded-full ${toneBar[band.tone]}`}
                    style={{ height: `${Math.max(8, (t.score / 100) * 40)}px` }}
                  />
                );
              })}
            </div>
          ) : null}
        </div>

        <ul className="mt-5 space-y-2">
          {sessions.map((s) => {
            const band = scoreBand(s.overallScore);
            const open = openId === s.id;
            return (
              <li
                key={s.id}
                className="overflow-hidden rounded-xl border border-border bg-background/40"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(open ? null : s.id)}
                  aria-expanded={open}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-foreground/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${toneChip[band.tone]}`}
                  >
                    {s.overallScore}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-foreground">
                      {s.roleTitle || "Mock interview"}
                    </div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-foreground/55">
                      <span>{formatDate(s.createdAt)}</span>
                      <span aria-hidden>·</span>
                      <span>{focusLabel(s.focus)}</span>
                      <span aria-hidden>·</span>
                      <span>{difficultyLabel(s.difficulty)}</span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`size-4 shrink-0 text-foreground/40 transition-transform ${open ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence initial={false}>
                  {open ? (
                    <motion.div
                      initial={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                      animate={reduceMotion ? undefined : { height: "auto", opacity: 1 }}
                      exit={reduceMotion ? undefined : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3 border-t border-border px-4 py-4">
                        {s.summary ? (
                          <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
                            <p className="text-sm text-foreground/80">{s.summary}</p>
                          </div>
                        ) : null}

                        {s.transcript.filter(Boolean).map((t, i) => {
                          const tBand = scoreBand(t.score);
                          return (
                            <div
                              key={i}
                              className="rounded-lg border border-border bg-card/60 p-4"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <p className="text-sm font-medium text-foreground">
                                  <span className="text-foreground/50">
                                    Q{i + 1}.
                                  </span>{" "}
                                  {t.question}
                                </p>
                                <span
                                  className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${toneChip[tBand.tone]}`}
                                >
                                  {t.score}
                                </span>
                              </div>
                              {(t.strengths?.length || t.improvements?.length) ? (
                                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                                  <div>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/55">
                                      <CheckCircle2 className="size-3.5 text-primary" />{" "}
                                      Strengths
                                    </div>
                                    <ul className="mt-1.5 space-y-1">
                                      {t.strengths?.length ? (
                                        t.strengths.map((x, j) => (
                                          <li
                                            key={j}
                                            className="text-sm text-foreground/75"
                                          >
                                            • {x}
                                          </li>
                                        ))
                                      ) : (
                                        <li className="text-sm text-foreground/40">
                                          —
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/55">
                                      <TrendingUp className="size-3.5 text-amber-500" />{" "}
                                      Improve
                                    </div>
                                    <ul className="mt-1.5 space-y-1">
                                      {t.improvements?.length ? (
                                        t.improvements.map((x, j) => (
                                          <li
                                            key={j}
                                            className="text-sm text-foreground/75"
                                          >
                                            • {x}
                                          </li>
                                        ))
                                      ) : (
                                        <li className="text-sm text-foreground/40">
                                          —
                                        </li>
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              ) : null}
                              {t.tip ? (
                                <p className="mt-3 text-sm text-foreground/70">
                                  <span className="font-medium text-foreground/80">
                                    Tip:
                                  </span>{" "}
                                  {t.tip}
                                </p>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </section>
    </Reveal>
  );
}
