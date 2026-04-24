"use client";

import { motion, useReducedMotion, Variants } from "framer-motion";

export default function BetaBanner() {
  const prefersReducedMotion = useReducedMotion();

  // Animation variants for container
  const container: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : -6 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.45,
        // Use cubic-bezier array to satisfy Framer's strict types
        ease: [0.25, 0.1, 0.25, 1],
        when: "beforeChildren",
        staggerChildren: prefersReducedMotion ? 0 : 0.08,
      },
    },
  };

  // Animation variants for individual lines
  const line: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 4 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.28,
        ease: [0.25, 0.1, 0.25, 1],
      },
    },
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
          Offervia helps you move from job description to tailored materials,
          tracking, and coaching in one focused workflow.
        </motion.p>
        <motion.p
          variants={line}
          className="mt-1 text-[11px] text-muted-foreground"
        >
          Start with Job Packet, then keep the rest of your search organized in one place.
        </motion.p>
      </div>
    </motion.div>
  );
}
