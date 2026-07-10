"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export default function Testimonials() {
  const items = [
    {
      quote:
        "I tailored my resume to the posting and started getting callbacks the same week. It felt built for candidates, not HR.",
      role: "New Grad",
      chip: "bg-primary/10 text-primary",
    },
    {
      quote:
        "The JD scanner showed exactly what to emphasize. It saved hours and made my applications more focused.",
      role: "Career Switcher",
      chip: "bg-success/10 text-success",
    },
    {
      quote:
        "Interview practice was realistic and short. I knew what to say and why — and landed more onsite rounds.",
      role: "Software Engineer",
      chip: "bg-warning/10 text-warning",
    },
  ];

  return (
    <section id="testimonials" className="relative bg-background scroll-mt-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-border" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold text-primary">Testimonials</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance">
            Real job seekers. Real results.
          </h2>
          <p className="mt-3 text-sm text-foreground/70">
            Clearer applications, faster iteration, and more confidence per submission.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {items.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              whileHover={{ y: -4 }}
              className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-white/5 transition-shadow hover:shadow-md dark:ring-black/10"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.chip}`}>
                <Quote className="h-5 w-5" />
              </div>
              <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/80">
                “{t.quote}”
              </p>
              <div className="mt-4 text-xs font-medium text-foreground/60">{t.role}</div>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
