"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type QA = { q: string; a: string };

const QA_ITEMS: QA[] = [
  {
    q: "Is Offervia free to use?",
    a: "Yes — Offervia is currently in free beta. In the future, a Pro tier with advanced resume insights and unlimited tailoring may be added, but core tools will remain accessible.",
  },
  {
    q: "How does the AI improve my resume?",
    a: "Our AI tailors your resume to match job descriptions, optimizes keywords, formats for ATS, and highlights impact using real hiring criteria.",
  },
  {
    q: "Do you store my resume or personal data?",
    a: "No. Resumes stay local to your session and are never used to train any models. Your data is private.",
  },
  {
    q: "Can I upload PDF or DOCX files?",
    a: "Yes — you can upload either format. DOCX provides cleaner text extraction, but both are supported.",
  },
  {
    q: "What makes Offervia different from other resume tools?",
    a: "Offervia is built specifically for job seekers — not employers — with real interview prep, JD scanning, and tailored resume outputs in one place.",
  },
];

function Item({ q, a }: QA) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-gray-900">{q}</span>
        <ChevronDown
          className={`h-4 w-4 text-gray-600 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="px-4 pb-4 text-sm text-gray-600">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Faq() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <h2 className="text-center text-2xl font-semibold text-gray-900">Frequently Asked Questions</h2>
        <div className="mx-auto mt-8 grid max-w-3xl gap-3">
          {QA_ITEMS.map((qa) => (
            <Item key={qa.q} {...qa} />
          ))}
        </div>
      </div>
    </section>
  );
}
