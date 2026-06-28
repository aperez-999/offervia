"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Shield, Sparkles } from "lucide-react";

export default function Why() {
  const items = [
    {
      title: "Built for Job Seekers",
      desc:
        "Purpose-built AI tools for candidates — not HR. Get focused help that speeds up applications and interview prep.",
      icon: Sparkles,
    },
    {
      title: "ATS-friendly outputs",
      desc:
        "Clean, scannable formatting with the right keywords so your resume shows up clearly to recruiters and systems.",
      icon: CheckCircle2,
    },
    {
      title: "Clear data handling",
      desc:
        "Offervia sends your uploads and prompts through secure server-side AI integrations so you can tailor resumes and keep your search history in one place.",
      icon: Shield,
    },
  ];

  // Subtle per-card tints (light & dark) for consistent “pill” look
  const accents = [
    {
      icon: "text-primary",
      lightBg: "bg-primary/10",
      darkBg: "",
      ring: "ring-ring",
    },
    {
      icon: "text-success",
      lightBg: "bg-success/10",
      darkBg: "",
      ring: "ring-ring",
    },
    {
      icon: "text-warning",
      lightBg: "bg-warning/10",
      darkBg: "",
      ring: "ring-ring",
    },
  ];

  return (
    <section className="relative bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl font-semibold text-foreground dark:text-white"
        >
          Why Offervia?
        </motion.h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-foreground/70">
          A workflow that keeps you moving: faster iteration, clearer targeting, and fewer dropped follow‑ups.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {items.map((it, idx) => {
            const Icon = it.icon;
            const a = accents[idx % accents.length];
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className={[
                  "rounded-2xl border border-border p-6 text-center shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md",
                  // base glass
                  "bg-white/70 dark:bg-neutral-900/40",
                  // subtle tint overlays
                  a.lightBg,
                  a.darkBg,
                ].join(" ")}
              >
                <div
                  className={[
                    "mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-neutral-900 ring-2",
                    a.ring,
                    "shadow-sm",
                  ].join(" ")}
                >
                  <Icon className={`h-5 w-5 ${a.icon}`} />
                </div>
                <h3 className="mt-1 text-base font-medium text-gray-900 dark:text-white">
                  {it.title}
                </h3>
                <p className="mt-2 text-sm text-gray-700 dark:text-white">
                  {it.desc}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
