"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FileSearch, FileText, MessageSquare, ClipboardList } from "lucide-react";

const BENEFITS = [
  {
    icon: FileSearch,
    title: "Scan a job posting",
    desc: "See which keywords and skills your resume is missing.",
    chip: "bg-info/10 text-info",
  },
  {
    icon: FileText,
    title: "Tailor your resume",
    desc: "Get a version rewritten for each job you apply to.",
    chip: "bg-primary/10 text-primary",
  },
  {
    icon: MessageSquare,
    title: "Practice interview answers",
    desc: "Work through likely questions before the real call.",
    chip: "bg-warning/10 text-warning",
  },
  {
    icon: ClipboardList,
    title: "Track your applications",
    desc: "Know where each one stands and when to follow up.",
    chip: "bg-success/10 text-success",
  },
];

export default function SignupAside() {
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
          All four tools work on the free plan.
        </h2>
        <p className="mt-3 max-w-xl text-sm text-foreground/70 text-pretty">
          Free accounts get a monthly allowance of scans, resumes, and cover letters.
          No credit card needed. Upgrade later if you run out.
        </p>
      </motion.div>

      <motion.div
        {...rise(0.08)}
        className="rounded-2xl border border-border bg-card p-6 shadow-sm"
      >
        <div className="text-sm font-medium text-foreground">What you can do</div>
        <ul className="mt-4 space-y-4">
          {BENEFITS.map((b) => {
            const Icon = b.icon;
            return (
              <li key={b.title} className="flex items-start gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${b.chip}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-foreground">{b.title}</div>
                  <div className="mt-0.5 text-xs text-foreground/60">{b.desc}</div>
                </div>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
}
