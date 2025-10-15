"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Shield, Sparkles } from "lucide-react";

export default function Why() {
  const items = [
    {
      title: "Built for Job Seekers",
      desc: "Purpose‑built AI tools for candidates — not HR. Get focused help that speeds up applications and interview prep.",
      icon: Sparkles,
    },
    {
      title: "ATS‑friendly outputs",
      desc: "Clean, scannable formatting with the right keywords so your resume shows up clearly to recruiters and systems.",
      icon: CheckCircle2,
    },
    {
      title: "Private & secure",
      desc: "Your uploads aren’t shared. Tailor resumes with confidence — your data stays with you.",
      icon: Shield,
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
          Why Offervia?
        </motion.h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {items.map((it, idx) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: idx * 0.05 }}
                className="rounded-lg border border-gray-200 bg-white p-5 text-center shadow-sm"
              >
                <Icon className="mx-auto h-5 w-5 text-indigo-600" />
                <h3 className="mt-2 text-base font-medium text-gray-900">{it.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{it.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
