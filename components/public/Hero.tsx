"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import HeroDemo from "./HeroDemo";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-background">
      <div className="mx-auto max-w-6xl px-4 pt-12 pb-10 sm:pt-16 sm:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground text-balance sm:text-5xl">
              Turn job descriptions into{" "}
              <span className="text-primary">interviews</span>.
            </h1>

            <p className="mt-4 max-w-2xl text-lg text-muted-foreground text-pretty">
              Paste a job posting and Offervia shows what your resume is missing,
              rewrites it for that job, drafts the cover letter, and reminds you when
              to follow up.
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                href="/signup"
                className="bg-brand-gradient inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 motion-safe:active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                Create a free account
              </Link>

              <a
                href="#how-it-works"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById("how-it-works");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="inline-flex items-center justify-center rounded-full border border-border bg-background/60 px-5 py-2.5 text-sm text-foreground/90 transition-colors hover:bg-accent hover:text-accent-foreground motion-safe:active:scale-[0.98]"
              >
                See how it works
              </a>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Free for students, new grads, and anyone applying. No credit card to start.
            </p>
          </div>

          <div className="mt-12 mb-10 sm:mb-12">
            <HeroDemo />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
