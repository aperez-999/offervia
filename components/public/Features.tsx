"use client";

import { motion } from "framer-motion";
import { MessageSquare, FileText, ClipboardList, Briefcase } from "lucide-react";

export default function Features() {
  const items = [
    {
      title: "AI Interview Coach",
      desc:
        "Practice answers, tighten stories, and prepare for real conversations without losing momentum.",
      icon: MessageSquare,
      chip: "bg-primary/10 text-primary",
      bullets: [
        "Quick prompts for behavioral, resume, and career questions",
        "Switch between brief and detailed coaching when needed",
        "Keep the conversation history for your next session",
      ],
    },
    {
      title: "Job Description Scanner",
      desc:
        "Scan any posting to surface requirements, missing skills, and the strongest resume angles before you apply.",
      icon: FileText,
      chip: "bg-info/10 text-info",
      bullets: [
        "Highlight strengths and keyword gaps in seconds",
        "Carry the same JD into Resume Tailor without re-pasting",
        "Save scan history to compare applications over time",
      ],
    },
    {
      title: "Resume Tailor",
      desc:
        "Generate a cleaner, more targeted draft while keeping the role, company, and JD context aligned.",
      icon: ClipboardList,
      chip: "bg-brand/10 text-brand",
      bullets: [
        "Upload once and iterate on tailored drafts quickly",
        "Keep outputs concise and ATS-aware",
        "Send finished work straight into your tracker flow",
      ],
    },
    {
      title: "Application Tracker",
      desc:
        "Track every application, keep follow-ups visible, and turn scattered searching into a system.",
      icon: Briefcase,
      chip: "bg-success/10 text-success",
      bullets: [
        "Quick-add applications or create them from Job Packet",
        "Sort by company, role, status, and date",
        "Export your progress when you want a full snapshot",
      ],
    },
  ];

  return (
    <section id="features" className="relative bg-background scroll-mt-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold text-primary">Features</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance">
            Everything you need to land the offer
          </h2>
          <p className="mt-3 text-sm text-foreground/70">
            One focused workflow — from job description to interview-ready, all in the same place.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-white/5 hover-glow dark:ring-black/10"
              >
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-3 ${it.chip}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="mt-4 text-base font-semibold text-foreground">{it.title}</h3>

                <p className="mt-2 text-sm leading-relaxed text-foreground/70">{it.desc}</p>

                <ul className="mt-4 space-y-2 text-xs text-foreground/70">
                  {it.bullets.map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-foreground/40" />
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
