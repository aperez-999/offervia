"use client";

import Link from "next/link";
import { motion } from "framer-motion";
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
        <div className="absolute -bottom-24 right-[-60px] h-64 w-64 rounded-full bg-amber-100/50 blur-3xl dark:hidden" />
        {/* Dark theme glow */}
        <div className="hidden dark:block absolute -top-24 left-1/2 h-72 w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-900/30 via-indigo-800/20 to-transparent blur-3xl" />
        <div className="hidden dark:block absolute top-40 -left-40 h-56 w-56 rounded-full bg-indigo-950/30 blur-2xl" />
        <div className="hidden dark:block absolute -bottom-24 right-[-60px] h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-10 pb-10 sm:pt-12 sm:pb-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mt-6"
        >
          <div className="mx-auto max-w-4xl text-center">
            <div className="inline-flex items-center rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-foreground">
              Offervia • AI career suite
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground dark:text-white sm:text-5xl">
              Turn job descriptions into interviews.
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Scan a posting, tailor your resume, and track follow‑ups in one place — built for job seekers who want momentum.
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-black"
              >
                Get started — free
              </Link>

              <a
                href="#features"
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.getElementById("features");
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className="inline-flex items-center justify-center rounded-full border border-border bg-background/60 px-5 py-2.5 text-sm text-foreground/90 hover:bg-foreground/5"
              >
                Explore features
              </a>
            </div>
          </div>

          <div className="mx-auto mt-10 mb-10 sm:mb-12 max-w-5xl rounded-3xl border border-border bg-card/60 p-4 shadow-2xl shadow-black/20 ring-1 ring-white/5 dark:ring-black/10 backdrop-blur sm:p-5 dark:shadow-black/40">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-sm font-medium text-foreground">Product demo</div>
            </div>
            <video
              ref={videoRef}
              className="aspect-[16/9] w-full rounded-2xl border border-dashed border-border object-cover"
              controls
              playsInline
              muted
            >
              <source src="/demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <p className="mt-3 text-xs text-foreground/60">
              Watch the Job Packet workflow: scan a JD, tailor a resume, then add to your tracker.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}