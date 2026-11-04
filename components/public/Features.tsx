"use client";

import { motion } from "framer-motion";
import { MessageSquare, FileText, ClipboardList, Briefcase } from "lucide-react";

export default function Features() {
  const items = [
    {
      title: "Job scanner",
      desc:
        "Paste a posting to see the skills and keywords it asks for, which ones your resume already shows, and which are missing.",
      icon: FileText,
      bullets: [
        "A match score with the missing keywords listed",
        "Send the same posting to Resume Tailor without pasting it again",
        "Past scans are saved so you can compare roles",
      ],
    },
    {
      title: "Resume Tailor",
      desc:
        "Upload your resume once. For each job, get a rewritten draft that uses the posting's language and keeps your real experience.",
      icon: ClipboardList,
      bullets: [
        "Make a new draft for every job you apply to",
        "Plain formatting that applicant tracking systems can read",
        "Save the finished version to that job in your tracker",
      ],
    },
    {
      title: "Interview coach",
      desc:
        "Practice the questions you're likely to get and get notes on what to cut, what to add, and where your answer loses the thread.",
      icon: MessageSquare,
      bullets: [
        "Starter questions for behavioral, resume, and career topics",
        "Short or detailed feedback, your choice",
        "Your past conversations are there next time",
      ],
    },
    {
      title: "Application tracker",
      desc:
        "One board for every job you've applied to, with the status of each and the date you should follow up.",
      icon: Briefcase,
      bullets: [
        "Add jobs by hand or straight from a Job Packet",
        "Sort by company, role, status, or date",
        "Export everything to CSV",
      ],
    },
  ];

  return (
    <section id="features" className="relative bg-background scroll-mt-20">
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
            What&apos;s in it
          </h2>
          <p className="mt-3 text-base text-foreground/70 text-pretty">
            Four tools that work from the same job posting, so you only paste it once.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-x-12 gap-y-10 md:grid-cols-2">
          {items.map((it, idx) => {
            const Icon = it.icon;
            return (
              <motion.div
                key={it.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.4, delay: idx * 0.04 }}
                className="border-t border-border pt-6"
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-5 w-5 text-primary" aria-hidden />
                  <h3 className="text-lg font-semibold text-foreground">{it.title}</h3>
                </div>

                <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-foreground/75 text-pretty">
                  {it.desc}
                </p>

                <ul className="mt-4 space-y-2 text-sm text-foreground/70">
                  {it.bullets.map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
                      <span className="leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
