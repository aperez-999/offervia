"use client";

import { motion } from "framer-motion";
import { Sparkles, ShieldCheck, Zap } from "lucide-react";

const items = [
  {
    title: "Fast iteration",
    desc: "Scan → tailor → apply in minutes.",
    icon: Zap,
    chip: "bg-warning/10 text-warning",
  },
  {
    title: "Handled with care",
    desc: "Processed securely through Offervia's server-side AI.",
    icon: ShieldCheck,
    chip: "bg-success/10 text-success",
  },
  {
    title: "Built for momentum",
    desc: "A workflow, not a one-off tool.",
    icon: Sparkles,
    chip: "bg-primary/10 text-primary",
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
                whileHover={{ y: -3 }}
                className="group rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 backdrop-blur transition-colors hover:border-primary/30 dark:ring-black/10"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110 ${it.chip}`}>
                    <Icon className="h-5 w-5" />
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
