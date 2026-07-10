"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

type Item = { quote: string; role: string; chip: string };

const ITEMS: Item[] = [
  {
    quote:
      "I tailored my resume to the posting and started getting callbacks the same week. It felt built for candidates, not HR.",
    role: "New Grad",
    chip: "bg-primary/10 text-primary",
  },
  {
    quote:
      "The JD scanner showed exactly what to emphasize. It saved hours and made my applications more focused.",
    role: "Career Switcher",
    chip: "bg-success/10 text-success",
  },
  {
    quote:
      "Interview practice was realistic and short. I knew what to say and why — and landed more onsite rounds.",
    role: "Software Engineer",
    chip: "bg-warning/10 text-warning",
  },
  {
    quote:
      "The tracker finally gave my search a system. No more spreadsheets — I can see every follow-up at a glance.",
    role: "Product Manager",
    chip: "bg-info/10 text-info",
  },
  {
    quote:
      "Cover letters used to take me an hour each. Now they're tailored to the company in seconds and actually sound like me.",
    role: "Marketing Analyst",
    chip: "bg-reward/10 text-reward",
  },
  {
    quote:
      "Going from scan to tailored resume to tracked application in one flow kept my momentum up during a tough search.",
    role: "Data Analyst",
    chip: "bg-primary/10 text-primary",
  },
];

function Card({ t }: { t: Item }) {
  return (
    <blockquote className="flex w-[300px] shrink-0 flex-col rounded-2xl border border-border bg-card p-6 shadow-sm sm:w-[340px]">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${t.chip}`}>
        <Quote className="h-5 w-5" />
      </div>
      <p className="mt-4 flex-1 text-sm leading-relaxed text-foreground/80">“{t.quote}”</p>
      <div className="mt-4 text-xs font-medium text-foreground/60">{t.role}</div>
    </blockquote>
  );
}

function Row({ reverse }: { reverse?: boolean }) {
  // Duplicate the list so the -50% translate loops seamlessly.
  const cards = [...ITEMS, ...ITEMS];
  return (
    <div className="group flex overflow-hidden">
      <div
        className={`flex w-max gap-4 pr-4 ${
          reverse ? "animate-marquee-reverse" : "animate-marquee"
        } group-hover:[animation-play-state:paused]`}
      >
        {cards.map((t, i) => (
          <Card key={i} t={t} />
        ))}
      </div>
    </div>
  );
}

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative bg-background scroll-mt-20">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 -top-px h-px bg-border" />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-xs font-semibold text-primary">Testimonials</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground text-balance">
            Real job seekers. Real results.
          </h2>
          <p className="mt-3 text-sm text-foreground/70">
            Clearer applications, faster iteration, and more confidence per submission.
          </p>
        </motion.div>
      </div>

      {/* Marquee rows with edge fade masks */}
      <div
        className="relative flex flex-col gap-4 pb-16 sm:pb-24 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]"
        style={{ ["--marquee-duration" as string]: "48s" }}
      >
        <Row />
        <Row reverse />
      </div>
    </section>
  );
}
