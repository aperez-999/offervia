"use client";

import { motion } from "framer-motion";

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

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl font-semibold text-gray-900"
        >
          Real job seekers. Real results.
        </motion.h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {items.map((t, i) => (
            <motion.blockquote
              key={i}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm text-gray-700">“{t.quote}”</p>
              <footer className="mt-3 text-xs font-medium text-gray-500">— {t.role}</footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
