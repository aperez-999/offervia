"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Sparkles } from "lucide-react";

type Tier = {
  name: string;
  price: string;
  tagline: string;
  bullets: string[];
  ctaLabel: string;
  ctaHref: string;
  highlight?: boolean;
};

const TIERS: Tier[] = [
  {
    name: "Free",
    price: "$0",
    tagline: "Start applying smarter today.",
    bullets: [
      "Resume tailoring + JD scanning (monthly limits)",
      "AI coaching for interview prep (monthly limits)",
      "Job tracker + reminders",
      "Cloud scan history across devices",
    ],
    ctaLabel: "Get started free",
    ctaHref: "/signup",
  },
  {
    name: "Pro",
    price: "Unlock more",
    tagline: "Higher limits for focused, consistent applying.",
    bullets: [
      "Much higher monthly limits",
      "Faster iteration with fewer interruptions",
      "Priority access to new features",
      "Support the project’s development",
    ],
    ctaLabel: "Upgrade anytime",
    ctaHref: "/signup",
    highlight: true,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="bg-background scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="text-2xl font-semibold text-foreground dark:text-white">
            Simple pricing that scales with your job search
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Start free. Upgrade when you want higher limits.
          </p>
        </motion.div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {TIERS.map((t, idx) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.45, delay: idx * 0.06 }}
              className={[
                "rounded-2xl border border-border p-6 shadow-sm backdrop-blur-sm",
                "bg-white/70 dark:bg-neutral-900/40",
                t.highlight ? "ring-2 ring-emerald-500/25" : "ring-1 ring-white/5 dark:ring-black/10",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-foreground/80">{t.name}</div>
                  <div className="mt-1 text-2xl font-semibold text-foreground dark:text-white">
                    {t.price}
                  </div>
                </div>
                {t.highlight && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Most popular
                  </span>
                )}
              </div>

              <p className="mt-2 text-sm text-foreground/70">{t.tagline}</p>

              <ul className="mt-4 space-y-2 text-sm text-foreground/80">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Link
                  href={t.ctaHref}
                  className={[
                    "inline-flex w-full items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
                    t.highlight
                      ? "bg-emerald-600 text-white hover:bg-emerald-500"
                      : "bg-indigo-600 text-white hover:bg-indigo-500",
                    "focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-black",
                    t.highlight ? "focus:ring-emerald-500" : "focus:ring-indigo-500",
                  ].join(" ")}
                >
                  {t.ctaLabel}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

