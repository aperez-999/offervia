"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  RotateCcw,
  TrendingUp,
  FileSearch,
  PenLine,
  BellRing,
} from "lucide-react";

const STATS = [
  { label: "Applied", value: "12", tone: "text-info", ring: "bg-info/10" },
  { label: "Interviews", value: "3", tone: "text-warning", ring: "bg-warning/10" },
  { label: "Offers", value: "1", tone: "text-success", ring: "bg-success/10" },
];

const ACTIVITY = [
  { icon: FileSearch, text: "Scanned “Senior PM” — Northwind Labs", when: "2d ago", accent: false },
  { icon: PenLine, text: "Tailored resume for Acme Corp", when: "3d ago", accent: false },
  { icon: BellRing, text: "Follow-up due Thursday", when: "Soon", accent: true },
];

export default function LoginAside() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div className="space-y-5">
      <motion.div {...rise(0)}>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
          <RotateCcw className="h-3.5 w-3.5 text-primary" />
          Welcome back
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground text-balance">
          Pick up right where you left off.
        </h2>
        <p className="mt-3 max-w-xl text-sm text-foreground/70">
          Your pipeline is saved and ready — jump back into the applications that
          matter most this week.
        </p>
      </motion.div>

      {/* Momentum snapshot */}
      <motion.div
        {...rise(0.08)}
        className="rounded-3xl border border-border bg-card p-6 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">This week</div>
          <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs font-medium text-success">
            <TrendingUp className="h-3.5 w-3.5" />
            On track
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl ${s.ring} px-3 py-3 text-center`}
            >
              <div className={`text-2xl font-semibold ${s.tone}`}>{s.value}</div>
              <div className="mt-0.5 text-xs text-foreground/60">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Weekly goal bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground/70">Weekly goal</span>
            <span className="font-medium text-foreground">8 / 10</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <motion.div
              className="h-full rounded-full bg-primary"
              initial={reduce ? false : { width: 0 }}
              animate={{ width: "80%" }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Recent activity */}
        <div className="mt-5 space-y-2">
          {ACTIVITY.map((a, i) => {
            const Icon = a.icon;
            return (
              <motion.div
                key={a.text}
                {...rise(0.3 + i * 0.08)}
                className="flex items-center gap-3 rounded-2xl border border-border bg-background/50 px-3 py-2.5"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                    a.accent ? "bg-primary/10 text-primary" : "bg-foreground/5 text-foreground/70"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground/80">
                  {a.text}
                </span>
                <span className="shrink-0 text-xs text-foreground/50">{a.when}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.p {...rise(0.55)} className="text-xs text-foreground/60">
        Signed out for a bit? Everything’s saved — nothing slipped.
      </motion.p>
    </div>
  );
}
