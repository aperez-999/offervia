"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Shield, Sparkles } from "lucide-react";

export default function Why() {
  const items = [
    {
      title: "Built for job seekers",
      desc:
        "Purpose-built AI tools for candidates — not HR. Focused help that speeds up applications and interview prep.",
      icon: Sparkles,
      chip: "bg-primary/10 text-primary",
    },
    {
      title: "ATS-friendly outputs",
      desc:
        "Clean, scannable formatting with the right keywords so your resume shows up clearly to recruiters and systems.",
      icon: CheckCircle2,
      chip: "bg-success/10 text-success",
    },
    {
      title: "Clear data handling",
      desc:
        "Uploads and prompts run through secure server-side AI so you can tailor resumes and keep your search history in one place.",
      icon: Shield,
      chip: "bg-warning/10 text-warning",
    },
  ];

  return (
    <section className="relative bg-background">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Why Offervia</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance">
            A workflow that keeps you moving
          </h2>
          <p className="mt-3 text-sm text-foreground/70">
            Faster iteration, clearer targeting, and fewer dropped follow-ups.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {items.map((it, idx) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm ring-1 ring-white/5 backdrop-blur transition-shadow hover:shadow-md dark:ring-black/10"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${it.chip}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">{it.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{it.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
