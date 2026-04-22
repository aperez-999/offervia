"use client";

import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";

const items = [
  {
    title: "Fast iteration",
    desc: "Scan → tailor → apply in minutes.",
    icon: Zap,
    tone: "text-amber-600 dark:text-amber-300",
    ring: "ring-amber-500/20",
    bg: "bg-amber-50 dark:bg-amber-500/5",
  },
  {
    title: "Privacy-first",
    desc: "Your data isn’t used to train models.",
    icon: ShieldCheck,
    tone: "text-emerald-600 dark:text-emerald-400",
    ring: "ring-emerald-500/20",
    bg: "bg-emerald-50 dark:bg-emerald-500/5",
  },
  {
    title: "Built for momentum",
    desc: "A workflow, not a one-off tool.",
    icon: Sparkles,
    tone: "text-indigo-600 dark:text-indigo-400",
    ring: "ring-indigo-500/20",
    bg: "bg-indigo-50 dark:bg-indigo-500/5",
  },
];

export default function ProofBar() {
  return (
    <section aria-label="Product highlights" className="bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-2 sm:pt-4 pb-10 sm:pb-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {items.map((it, idx) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                className={[
                  "rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10",
                  "backdrop-blur",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-full bg-white dark:bg-neutral-900 ring-2",
                      it.ring,
                      it.bg,
                    ].join(" ")}
                  >
                    <Icon className={`h-5 w-5 ${it.tone}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-foreground">{it.title}</div>
                    <div className="mt-0.5 text-xs text-foreground/70">{it.desc}</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

