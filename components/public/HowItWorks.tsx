"use client";

import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      title: "Upload",
      desc:
        "Upload your resume or paste a job description—no formatting needed. Start in seconds.",
    },
    {
      title: "Tailor",
      desc:
        "AI analyzes the role, surfaces keywords, and aligns your content for clarity and fit—fast.",
    },
    {
      title: "Apply",
      desc:
        "Send polished, focused applications with confidence. Export your updates and apply right away.",
    },
  ];

  // Subtle per-card accent tints (light & dark), matching Testimonials/Why
  const ACCENTS = [
    { lightBg: "bg-indigo-50",  darkBg: "dark:bg-indigo-500/5",  ring: "ring-indigo-500/20" },
    { lightBg: "bg-sky-50",     darkBg: "dark:bg-sky-500/5",     ring: "ring-sky-500/20" },
    { lightBg: "bg-violet-50",  darkBg: "dark:bg-violet-500/5",  ring: "ring-violet-500/20" },
  ];

  return (
    <section id="how-it-works" className="relative bg-background scroll-mt-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto max-w-5xl px-4 py-14 sm:py-16">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl font-semibold text-foreground dark:text-white"
        >
          How it works
        </motion.h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-foreground/70">
          A simple, repeatable loop you can run for every application.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => {
            const acc = ACCENTS[i % ACCENTS.length];
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className={[
                  "rounded-2xl border border-border shadow-sm backdrop-blur-sm ring-2 transition-shadow hover:shadow-md",
                  // glass base
                  "bg-white/70 dark:bg-neutral-900/40",
                  // tinted overlays
                  acc.lightBg,
                  acc.darkBg,
                  acc.ring,
                  "p-5 text-center",
                ].join(" ")}
              >
                <div
                  className={[
                    "mx-auto mb-3 flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold",
                    // badge: soft gray in light, deeper gray in dark with white text
                    "bg-neutral-200 text-neutral-900",
                    "dark:bg-neutral-700 dark:text-white",
                  ].join(" ")}
                >
                  {i + 1}
                </div>

                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-700 dark:text-white">
                  {s.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}