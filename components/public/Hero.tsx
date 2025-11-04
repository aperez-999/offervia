"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import BetaBanner from "@/components/public/BetaBanner";
import { useEffect, useRef } from "react";

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const setRate = () => (video.playbackRate = 1.75);
      video.addEventListener("loadedmetadata", setRate);
      return () => video.removeEventListener("loadedmetadata", setRate);
    }
  }, []);

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Abstract gradient backdrop: separate light/dark layers, behind content */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        {/* Light theme glow */}
        <div className="absolute -top-24 left-1/2 h-72 w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200/60 via-indigo-100/40 to-transparent blur-3xl dark:hidden" />
        <div className="absolute top-40 -left-40 h-56 w-56 rounded-full bg-indigo-100/50 blur-2xl dark:hidden" />
        {/* Dark theme glow */}
        <div className="hidden dark:block absolute -top-24 left-1/2 h-72 w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-900/30 via-indigo-800/20 to-transparent blur-3xl" />
        <div className="hidden dark:block absolute top-40 -left-40 h-56 w-56 rounded-full bg-indigo-950/30 blur-2xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8 sm:pt-10">
        <BetaBanner />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          {/* Beta pill */}
          <div className="mt-4 sm:mt-4 mx-auto w-fit rounded-full border border-black/5 bg-white/90 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm dark:border-white/10 dark:bg-neutral-900/80 dark:text-indigo-300">
            Free for Job Seekers • No credit card required
          </div>

          <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground dark:text-white sm:text-5xl">
            AI resume builder, interview coach, and job search tools — built for job seekers.
          </h1>

          <p className="mt-4 text-lg text-muted-foreground dark:text-white">
            Tailor your resume to any job description, practice interviews with realistic prompts, and scan postings
            for skills and keywords to land offers faster.
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-black"
            >
              Get Started – Free
            </Link>

            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("features");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
            >
              Explore Features
            </a>
          </div>

          <div className="mt-10 rounded-2xl border border-border bg-white/60 p-4 shadow-lg backdrop-blur ring-1 ring-indigo-500/10 dark:bg-neutral-900/40">
            <video
              ref={videoRef}
              className="aspect-[16/9] w-full rounded-xl border border-dashed border-border object-cover"
              controls
              playsInline
              muted
            >
              <source src="/demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        </motion.div>
      </div>
    </section>
  );
}