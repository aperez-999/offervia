"use client";

import { motion } from "framer-motion";

export default function HowItWorks() {
  const steps = [
    {
      title: "Paste the job posting",
      desc: "Copy it from LinkedIn, Indeed, or the company's careers page. Add your resume as a PDF or DOCX, or paste the text.",
    },
    {
      title: "Fix the gaps",
      desc: "See which requirements your resume doesn't cover yet, then get a rewritten resume and a cover letter draft for that job. Change anything that isn't accurate.",
    },
    {
      title: "Apply and keep track",
      desc: "Download the files, send your application, and add the job to your tracker so you know when to follow up.",
    },
  ];

  return (
    <section id="how-it-works" className="relative bg-background scroll-mt-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-border" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <div className="grid gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] md:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl font-semibold tracking-tight text-foreground text-balance">
              How it works
            </h2>
            <p className="mt-3 text-base text-foreground/70 text-pretty">
              The same three steps for every job you apply to.
            </p>
          </motion.div>

          <ol className="divide-y divide-border border-y border-border">
            {steps.map((s, i) => (
              <motion.li
                key={s.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="grid grid-cols-[2.5rem_1fr] gap-4 py-6"
              >
                <span className="font-mono text-sm tabular-nums text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-foreground/70 text-pretty">
                    {s.desc}
                  </p>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
