"use client";

import { motion } from "framer-motion";
import { MessageSquare, FileText, ClipboardList, Stamp } from "lucide-react";

export default function Features() {
  const items = [
    {
      title: "AI Interview Coach",
      desc:
        "Prepare faster with realistic practice questions and concise coaching — get interview-ready in less time.",
      icon: MessageSquare,
    },
    {
      title: "Job Description Scanner",
      desc:
        "Scan any posting to extract required skills, keywords, and gaps so you can target your resume effectively.",
      icon: FileText,
    },
    {
      title: "Resume Tailor",
      desc:
        "Use the AI resume builder to tailor content to the role and stay ATS-friendly for better visibility.",
      icon: ClipboardList,
    },
    {
      title: "Cover Letter Builder (Coming Soon)",
      desc:
        "Quickly draft focused cover letters that highlight motivation and fit — no fluff.",
      icon: Stamp,
    },
  ];

  // Per-card accent tints to match the pill look (light & dark)
  const accents = [
    {
      icon: "text-indigo-600 dark:text-indigo-400",
      lightBg: "bg-indigo-50",
      darkBg: "dark:bg-indigo-500/5",
      ring: "ring-indigo-500/20",
    },
    {
      icon: "text-sky-600 dark:text-sky-400",
      lightBg: "bg-sky-50",
      darkBg: "dark:bg-sky-500/5",
      ring: "ring-sky-500/20",
    },
    {
      icon: "text-violet-600 dark:text-violet-400",
      lightBg: "bg-violet-50",
      darkBg: "dark:bg-violet-500/5",
      ring: "ring-violet-500/20",
    },
    {
      icon: "text-fuchsia-600 dark:text-fuchsia-400",
      lightBg: "bg-fuchsia-50",
      darkBg: "dark:bg-fuchsia-500/5",
      ring: "ring-fuchsia-500/20",
    },
  ];

  return (
    <section id="features" className="bg-background scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl font-semibold text-foreground dark:text-white"
        >
          Everything you need to land the offer
        </motion.h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  "rounded-xl border border-border p-5 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md",
                  // base glass
                  "bg-white/70 dark:bg-neutral-900/40",
                  // subtle tint overlays
                  a.lightBg,
                  a.darkBg,
                ].join(" ")}
              >
                <div
                  className={[
                    "mb-2 mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-neutral-900 ring-2",
                    a.ring,
                  ].join(" ")}
                >
                  <Icon className={`h-5 w-5 ${a.icon}`} />
                </div>

                <h3 className="text-center text-base font-medium text-gray-900 dark:text-white">
                  {it.title}
                </h3>

                <p className="mt-2 text-center text-sm text-gray-700 dark:text-white">
                  {it.desc}
                </p>

                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-gray-700 dark:text-white">
                  <li>Save time with tailored recommendations</li>
                  <li>Stay concise and ATS-friendly</li>
                  <li>Built for job seekers, not HR</li>
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}