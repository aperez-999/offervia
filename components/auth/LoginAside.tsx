"use client";

import { motion, useReducedMotion } from "framer-motion";
import { BellRinging, FileMagnifyingGlass, PenNib } from "@phosphor-icons/react/dist/ssr";

const STATS = [
  { label: "Applied", value: "12", tone: "text-info", ring: "bg-info/10" },
  { label: "Interviews", value: "3", tone: "text-warning", ring: "bg-warning/10" },
  { label: "Offers", value: "1", tone: "text-success", ring: "bg-success/10" },
];

const ACTIVITY = [
  { icon: FileMagnifyingGlass, text: "Scanned Senior PM at Northwind Labs", when: "2d ago", accent: false },
  { icon: PenNib, text: "Tailored resume for Halden & Co.", when: "3d ago", accent: false },
  { icon: BellRinging, text: "Follow up with Brightline on Thursday", when: "Due", accent: true },
];

export default function LoginAside() {
  const reduce = useReducedMotion();
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 12 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay, ease: "easeOut" as const },
        };

  return (
    <div className="relative space-y-5">
      <motion.div {...rise(0)}>
        <h2 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
          Your applications are where you left them.
        </h2>
        <p className="mt-3 max-w-xl text-sm text-foreground/70 text-pretty">
          Sign in to see what&apos;s due this week and finish any drafts you started.
        </p>
      </motion.div>

      <motion.div
        {...rise(0.08)}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-foreground">This week</div>
          <span className="text-xs text-foreground/50">Example</span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className={`rounded-2xl ${s.ring} px-3 py-3 text-center`}
            >
              <div className={`text-2xl font-semibold tabular-nums ${s.tone}`}>{s.value}</div>
              <div className="mt-0.5 text-xs text-foreground/60">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground/70">Weekly goal</span>
            <span className="font-medium tabular-nums text-foreground">8 / 10</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-4/5 rounded-full bg-primary" />
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {ACTIVITY.map((a) => {
            const Icon = a.icon;
            return (
              <div
                key={a.text}
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
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
