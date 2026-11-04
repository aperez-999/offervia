"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, ListChecks, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type QuickStartItem = {
  key: string;
  label: string;
  href: string;
  done: boolean;
};

export default function QuickStart({
  items,
  done,
  total,
  pct,
  onDismiss,
}: {
  items: QuickStartItem[];
  done: number;
  total: number;
  pct: number;
  onDismiss: () => void;
}) {
  const reduce = useReducedMotion();
  const nextIndex = items.findIndex((i) => !i.done);

  const container = {
    hidden: {},
    show: {
      transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: 0.05 },
    },
  };
  const step = {
    hidden: reduce ? { opacity: 1 } : { opacity: 0, x: -12 },
    show: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  return (
    <motion.section
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={reduce ? undefined : { opacity: 0, y: -8, height: 0, marginTop: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      aria-label="Getting started"
    >
      <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card p-5 shadow-sm sm:p-6">

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <ListChecks className="h-4.5 w-4.5" />
            </span>
            <div>
              <h2 className="text-base font-semibold text-foreground">Getting started</h2>
              <p className="text-xs text-foreground/60">
                {done === total
                  ? "All steps done."
                  : `${done} of ${total} done`}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 rounded-full p-0 text-foreground/60 hover:bg-foreground/[0.06] hover:text-foreground"
            onClick={onDismiss}
            aria-label="Hide getting started"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress rail */}
        <div className="relative mt-4 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
          <motion.div
            className="h-full rounded-full bg-primary"
            initial={reduce ? false : { width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.15 }}
          />
        </div>

        {/* Steps */}
        <motion.ol
          variants={container}
          initial="hidden"
          animate="show"
          className="relative mt-4 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {items.map((it, i) => {
            const isNext = i === nextIndex;
            return (
              <motion.li key={it.key} variants={step}>
                <Link
                  href={it.href}
                  aria-current={isNext ? "step" : undefined}
                  className={[
                    "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    "motion-safe:hover:-translate-y-0.5",
                    it.done
                      ? "border-success/25 bg-success/[0.06]"
                      : isNext
                      ? "border-primary/30 bg-primary/[0.06] shadow-sm"
                      : "border-border bg-background/50 hover:border-primary/25 hover:bg-primary/[0.04]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                      it.done
                        ? "bg-success/15 text-success"
                        : isNext
                        ? "bg-primary-button text-white"
                        : "bg-foreground/10 text-foreground/70",
                    ].join(" ")}
                  >
                    {it.done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                  </span>
                  <span
                    className={[
                      "min-w-0 flex-1 truncate text-sm font-medium",
                      it.done ? "text-foreground/60 line-through" : "text-foreground",
                    ].join(" ")}
                  >
                    {it.label}
                  </span>
                  {!it.done && (
                    <ArrowRight className="h-4 w-4 shrink-0 text-foreground/40 transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
                  )}
                </Link>
              </motion.li>
            );
          })}
        </motion.ol>
      </div>
    </motion.section>
  );
}
