"use client";

import { motion } from "framer-motion";
import { MessageSquare, FileText, ClipboardList, Stamp } from "lucide-react";

export default function Features() {
  const items = [
    {
      title: "AI Interview Coach",
      desc: "Prepare faster with realistic practice questions and concise coaching — get interview‑ready in less time.",
      icon: MessageSquare,
    },
    {
      title: "Job Description Scanner",
      desc: "Scan any posting to extract required skills, keywords, and gaps so you can target your resume effectively.",
      icon: FileText,
    },
    {
      title: "Resume Tailor",
      desc: "Use the AI resume builder to tailor content to the role and stay ATS‑friendly for better visibility.",
      icon: ClipboardList,
    },
    {
      title: "Cover Letter Builder (Coming Soon)",
      desc: "Quickly draft focused cover letters that highlight motivation and fit — no fluff.",
      icon: Stamp,
    },
  ];
  return (
    <section id="features" className="bg-white scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16" id="features">
        <motion.h2
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl font-semibold text-gray-900"
        >
          Everything you need to land the offer
        </motion.h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow"
              >
                <div className="mb-2 flex items-center gap-2 text-gray-900">
                  <Icon className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-base font-medium">{it.title}</h3>
                </div>
                <p className="text-sm text-gray-600">{it.desc}</p>
                <ul className="mt-3 list-disc pl-5 text-xs text-gray-500 space-y-1">
                  <li>Save time with tailored recommendations</li>
                  <li>Stay concise and ATS-friendly</li>
                  <li>Built for job seekers, not HR</li>
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
