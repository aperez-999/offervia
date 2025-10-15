"use client";

import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    { title: "Upload", desc: "Add your resume or paste a job description." },
    { title: "Tailor", desc: "Get AI suggestions aligned to the role." },
    { title: "Apply", desc: "Send stronger applications with confidence." },
  ];
  return (
    <section className="bg-gradient-to-b from-white to-indigo-50/60">
      <div className="mx-auto max-w-5xl px-4 py-14 sm:py-16">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl font-semibold text-gray-900"
        >
          How it works
        </motion.h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.05 }}
              className="rounded-lg border border-gray-200 bg-white p-4 text-center shadow-sm"
            >
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                {i + 1}
              </div>
              <h3 className="text-base font-medium text-gray-900">{s.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
