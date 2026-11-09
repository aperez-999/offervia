"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDown } from "@phosphor-icons/react/dist/ssr";

type QA = { q: string; a: string };

const QA_ITEMS: QA[] = [
  {
    q: "Is Offervia free?",
    a: "Yes. Each month the free plan includes 10 job scans, 5 tailored resumes, 3 cover letters, 5 interview sessions, and 25 coach messages. The tracker has no monthly cap.",
  },
  {
    q: "What does Resume Tailor actually change?",
    a: "It rewrites your summary and bullets so they use the skills and terms the posting asks for, and keeps the formatting simple enough for applicant tracking systems to read. It works from what's already on your resume, so read the draft and fix anything that isn't true before you send it.",
  },
  {
    q: "What do I get with Pro?",
    a: "Much higher monthly limits on everything. It's worth it if you're applying to several jobs a week and keep hitting the free caps.",
  },
  {
    q: "Do you store my resume or personal data?",
    a: "We store what the app needs to work: your account, tracker entries, coach messages, and saved job scans. Resume text, job descriptions, and chat messages are sent from our server to an AI model to generate results. Drafts you keep only in your browser stay on that device.",
  },
  {
    q: "Can I upload a PDF or DOCX?",
    a: "Yes, either one works. DOCX files usually give cleaner text, so use one if you have it.",
  },
  {
    q: "How is this different from a resume builder?",
    a: "A resume builder gives you one document. Offervia is organized around the job: the posting, the version of your resume you sent, the cover letter, your interview prep, and where the application stands.",
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
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-foreground/[0.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-sm font-medium text-foreground">{q}</span>
        <CaretDown
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
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-border" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl"
        >
          <h2 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
            Questions people ask
          </h2>
        </motion.div>

        <div className="mt-10 grid max-w-3xl gap-3">
          {QA_ITEMS.map((qa, i) => (
            <Item key={qa.q} idx={i} {...qa} />
          ))}
        </div>
      </div>
    </section>
  );
}
