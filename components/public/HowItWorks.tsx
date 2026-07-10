"use client";

import { motion } from "framer-motion";
import { Upload, Wand2, Send } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      title: "Upload",
      desc: "Upload your resume or paste a job description — no formatting needed. Start in seconds.",
      icon: Upload,
    },
    {
      title: "Tailor",
      desc: "AI analyzes the role, surfaces keywords, and aligns your content for clarity and fit — fast.",
      icon: Wand2,
    },
    {
      title: "Apply",
      desc: "Send polished, focused applications with confidence, then export your updates and apply right away.",
      icon: Send,
    },
  ];

  return (
    <section id="how-it-works" className="relative bg-background scroll-mt-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold text-primary">How it works</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance">
            A simple, repeatable loop
          </h2>
          <p className="mt-3 text-sm text-foreground/70">
            Run the same focused flow for every application.
          </p>
        </motion.div>

        <div className="relative mt-12 grid gap-6 sm:grid-cols-3">
          <div aria-hidden className="pointer-events-none absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-border to-transparent sm:block" />
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className="relative rounded-2xl border border-border bg-card p-6 text-center shadow-sm ring-1 ring-white/5 transition-shadow hover:shadow-md dark:ring-black/10"
              >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="mt-3 text-xs font-medium text-foreground/50">
                  Step {i + 1}
                </div>
                <h3 className="mt-1 text-base font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{s.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
