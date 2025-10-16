"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { SectionCard } from "@/components/ui/SectionCard";

export default function PrivacyPage() {
  const lastUpdated = new Date().toLocaleDateString();

  const sections = [
    { id: "introduction", title: "Introduction" },
    { id: "data-we-collect", title: "Data We Collect" },
    { id: "how-data-is-used", title: "How Data Is Used" },
    { id: "ai-and-security", title: "AI & Security" },
    { id: "user-rights", title: "Your Rights" },
    { id: "cookies", title: "Cookies" },
    { id: "changes", title: "Changes to this Policy" },
    { id: "contact", title: "Contact" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-16 text-foreground">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-10 text-center"
      >
        <div className="mx-auto w-fit rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-foreground/80 backdrop-blur">
          Last updated: {lastUpdated}
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground dark:text-white">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground dark:text-white">
          Offervia is built for job seekers. We handle your information with care and transparency.
        </p>
      </motion.header>

      <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        {/* Sticky TOC (desktop) */}
        <aside className="sticky top-20 hidden self-start lg:block">
          <nav className="space-y-1 text-sm">
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="block rounded-md px-2 py-1 text-foreground/80 hover:bg-foreground/5"
              >
                {s.title}
              </a>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <article className="space-y-6">
          {/* Intro callout */}
          <motion.section
            id="introduction"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35 }}
            className="rounded-xl border border-white/10 bg-[rgba(99,102,241,0.05)] p-5 shadow-sm ring-1 ring-indigo-500/10 dark:border-white/10 dark:bg-[rgba(99,102,241,0.06)]"
          >
            <h2 className="text-base font-semibold text-foreground dark:text-white">Introduction</h2>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90 dark:text-white">
              Offervia is an AI career suite built for job seekers. During our free beta, this policy
              explains what we collect, how we use it, and your choices. We don’t sell your data.
            </p>
          </motion.section>

          <SectionCard id="data-we-collect" title="Data We Collect">
            <p>We collect the minimum necessary to provide and improve Offervia:</p>
            <ul className="mt-2 list-disc pl-5">
              <li>Account details (e.g., email) for sign-in and security.</li>
              <li>Content you provide (e.g., resumes or job descriptions) to deliver features.</li>
              <li>Basic usage metrics (aggregated/anonymized) to improve performance and reliability.</li>
            </ul>
          </SectionCard>

          <SectionCard id="how-data-is-used" title="How Data Is Used">
            <p>
              Your data powers features like resume tailoring, interview coaching, and job description
              scanning. We may aggregate anonymous metrics to understand which features help most and to
              guide product improvements.
            </p>
          </SectionCard>

          <SectionCard id="ai-and-security" title="AI & Security">
            <p>
              Resumes and job descriptions are processed to generate tailored content and insights. We aim
              to minimize retention and do not use your uploads to train our own models. We employ reasonable
              safeguards to protect data in transit and at rest, but no system is perfectly secure.
            </p>
          </SectionCard>

          <SectionCard id="user-rights" title="Your Rights">
            <p>
              You can request access or deletion of your account data. During beta, some requests may take
              time, but we’ll do our best to help. For any privacy questions, reach out via our contact page.
            </p>
          </SectionCard>

          <SectionCard id="cookies" title="Cookies">
            <p>
              We may use cookies or similar technologies to keep you signed in, remember preferences, and
              measure basic usage. You can control cookies through your browser settings.
            </p>
          </SectionCard>

          <SectionCard id="changes" title="Changes to this Policy">
            <p>
              We may update this policy as Offervia evolves. We’ll adjust the “Last updated” date above and,
              when appropriate, provide additional notice.
            </p>
          </SectionCard>

          <SectionCard id="contact" title="Contact">
            <p>
              Questions about privacy?{" "}
              <Link
                href="/contact"
                className="underline decoration-indigo-500/60 underline-offset-4 hover:decoration-indigo-500"
              >
                Contact us
              </Link>
              . We’re here to help.
            </p>
          </SectionCard>

          {/* Back to top */}
          <div className="pt-2">
            <a
              href="#"
              className="inline-block rounded-md border border-border px-3 py-1.5 text-sm hover:bg-foreground/5"
            >
              Back to top
            </a>
          </div>
        </article>
      </div>
    </main>
  );
}