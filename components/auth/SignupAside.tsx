"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Check,
  FileSearch,
  FileText,
  MessageSquare,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

const BENEFITS = [
  {
    icon: FileSearch,
    title: "Scan any job post",
    desc: "Spot keyword gaps and strengths instantly.",
    chip: "bg-info/10 text-info",
  },
  {
    icon: FileText,
    title: "Tailor your resume",
    desc: "ATS-friendly edits, matched to the role in seconds.",
    chip: "bg-primary/10 text-primary",
  },
  {
    icon: MessageSquare,
    title: "Practice with an AI coach",
    desc: "Sharper answers before every interview.",
    chip: "bg-warning/10 text-warning",
  },
  {
    icon: ClipboardList,
    title: "Track every application",
    desc: "Keep follow-ups from slipping through the cracks.",
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
          transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <div className="relative space-y-5">
      {/* Ambient breathing glow (matches landing hero) */}
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-6 -top-10 -z-10 h-56 w-56 rounded-full bg-primary/10 blur-3xl"
          animate={{ opacity: [0.5, 0.85, 0.5], scale: [1, 1.06, 1] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <motion.div {...rise(0)}>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
          <motion.span
            animate={reduce ? undefined : { rotate: [0, 12, -8, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" />
          </motion.span>
          Free to start
        </div>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-foreground text-balance">
          Start landing interviews this week.
        </h2>
        <p className="mt-3 max-w-xl text-sm text-foreground/70">
          Create your free account and unlock the full toolkit to go from job post
          to offer — no credit card required.
        </p>
      </motion.div>

      {/* What you'll unlock */}
      <motion.div
        {...rise(0.08)}
        whileHover={reduce ? undefined : { y: -3 }}
        className="rounded-3xl border border-border bg-card p-6 shadow-sm ring-1 ring-white/5 transition-shadow hover:shadow-md dark:ring-black/10"
      >
        <div className="text-sm font-medium text-foreground">What you’ll unlock</div>
        <ul className="mt-4 space-y-3">
          {BENEFITS.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.li
                key={b.title}
                {...rise(0.16 + i * 0.09)}
                className="flex items-start gap-3"
              >
                <motion.span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${b.chip}`}
                  animate={reduce ? undefined : { y: [0, -3, 0] }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.6 + i * 0.35,
                  }}
                >
                  <Icon className="h-4 w-4" />
                </motion.span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-foreground">{b.title}</span>
                    <motion.span
                      initial={reduce ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        duration: 0.35,
                        delay: 0.35 + i * 0.09,
                        ease: [0.34, 1.56, 0.64, 1],
                      }}
                      className="flex h-4 w-4 items-center justify-center rounded-full bg-success/15 text-success"
                    >
                      <Check className="h-3 w-3" />
                    </motion.span>
                  </div>
                  <div className="mt-0.5 text-xs text-foreground/60">{b.desc}</div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      </motion.div>

      <motion.div
        {...rise(0.6)}
        className="flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3"
      >
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
        <p className="text-sm text-foreground">
          <span className="font-medium">No credit card required.</span>{" "}
          <span className="text-foreground/70">Upgrade only when you’re ready.</span>
        </p>
      </motion.div>
    </div>
  );
}
