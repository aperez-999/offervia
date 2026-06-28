"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

type QA = { q: string; a: string };

const QA_ITEMS: QA[] = [
  {
    q: "Is Offervia free to use?",
    a: "Yes. Offervia has a generous free tier with monthly limits to keep the platform fast and fair for everyone.",
  },
  {
    q: "How does the AI improve my resume?",
    a: "Our AI tailors your resume to match job descriptions, optimizes keywords, formats for ATS, and highlights impact using real hiring criteria.",
  },
  {
    q: "What do I get with Pro?",
    a: "Pro is recommended if you’re applying consistently. It unlocks much higher monthly limits so you can scan and tailor without interruptions.",
  },
  {
    q: "Do you store my resume or personal data?",
    a: "Offervia stores the account data and feature history needed to run the app, such as tracker entries, coach messages, and saved job scans. Resume text, job descriptions, and chat prompts are processed through Offervia’s server-side AI flow to generate results, and browser-only drafts stay on the device where you created them.",
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

function Item({ q, a, idx }: QA & { idx: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35, delay: idx * 0.03 }}
      className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 backdrop-blur dark:ring-black/10"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-foreground/50 transition-transform ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            <div className="px-5 pb-4 text-sm leading-relaxed text-foreground/70">{a}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function Faq() {
  return (
    <section id="faq" className="relative bg-background scroll-mt-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">FAQ</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance">
            Frequently asked questions
          </h2>
        </motion.div>

        <div className="mx-auto mt-12 grid max-w-3xl gap-3">
          {QA_ITEMS.map((qa, i) => (
            <Item key={qa.q} idx={i} {...qa} />
          ))}
        </div>
      </div>
    </section>
  );
}
