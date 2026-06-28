"use client";

import { motion } from "framer-motion";
import { User2 } from "lucide-react";

export default function Testimonials() {
  const items = [
    {
      quote:
        "I tailored my resume to the posting and started getting callbacks the same week. It felt built for candidates, not HR.",
      role: "New Grad",
    },
    {
      quote:
        "The JD scanner showed exactly what to emphasize. It saved hours and made my applications more focused.",
      role: "Career Switcher",
    },
    {
      quote:
        "Interview practice was realistic and short. I knew what to say and why — and landed more onsite rounds.",
      role: "Software Engineer",
    },
  ];

  // Per-card accents to differentiate pills (light & dark)
  const accents = [
    {
      icon: "text-primary",
      lightBg: "bg-primary/10",
      darkBg: "",
      ring: "ring-primary/20",
    },
    {
      icon: "text-success",
      lightBg: "bg-success/10",
      darkBg: "",
      ring: "ring-success/20",
    },
    {
      icon: "text-warning",
      lightBg: "bg-warning/10",
      darkBg: "",
      ring: "ring-warning/20",
    },
  ];

  return (
    <section id="testimonials" className="relative bg-background scroll-mt-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl font-semibold text-foreground dark:text-white"
        >
          Real job seekers. Real results.
        </motion.h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-foreground/70">
          Built for momentum: clearer applications, faster iteration, and more confidence per submission.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {items.map((t, i) => {
            const a = accents[i % accents.length];
            return (
              <motion.blockquote
                key={i}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: i * 0.05 }}
                whileHover={{ y: -4 }}
                className={[
                  // pill container
                  "rounded-2xl border border-border p-6 shadow-sm backdrop-blur-sm transition-shadow hover:shadow-md",
                  // base backgrounds
                  "bg-white/70 dark:bg-neutral-900/40",
                  // accented backgrounds (override base subtly)
                  a.lightBg,
                  a.darkBg,
                ].join(" ")}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      "h-9 w-9 rounded-full flex items-center justify-center",
                      "bg-white dark:bg-neutral-900",
                      "ring-2", a.ring,
                    ].join(" ")}
                  >
                    <User2 className={`h-5 w-5 ${a.icon}`} />
                  </div>
                  <div className="text-xs font-medium text-gray-900 dark:text-white">{t.role}</div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-gray-800 dark:text-white">
                  “{t.quote}”
                </p>
              </motion.blockquote>
            );
          })}
        </div>
      </div>
    </section>
  );
}