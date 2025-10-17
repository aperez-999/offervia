"use client";

import { motion, useReducedMotion } from "framer-motion";

export default function BetaBanner() {
  const prefersReducedMotion = useReducedMotion();

  const container = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : -6 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: prefersReducedMotion ? 0 : 0.08,
      },
    },
  };

  const line = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 4 },
    show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
  };

  return (
    <motion.div
      className="mx-auto max-w-3xl px-4"
      initial="hidden"
      animate="show"
      variants={container}
      aria-live="polite"
    >
      <div className="rounded-full border border-border bg-muted/60 px-3 py-2 text-center shadow-sm ring-1 ring-white/5 backdrop-blur-sm dark:ring-black/10">
        <motion.p
          variants={line}
          className="text-xs font-medium text-muted-foreground"
        >
          Offervia is currently in free Beta — core tools are free while we continue
          building Pro features.
        </motion.p>
        <motion.p
          variants={line}
          className="mt-1 text-[11px] text-muted-foreground"
        >
          Future Pro features coming soon • Feedback welcome
        </motion.p>
      </div>
    </motion.div>
  );
}