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
      {/* Abstract gradient backdrop: token-driven brand glow */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="brand-glow absolute inset-x-0 -top-24 h-96" />
        <div className="absolute top-40 -left-40 h-56 w-56 rounded-full bg-primary/10 blur-2xl" />
        <div className="absolute -bottom-24 right-[-60px] h-64 w-64 rounded-full bg-[var(--chart-2)]/10 blur-3xl" />
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
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-foreground">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Offervia • AI career suite
            </div>

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Turn job descriptions into{" "}
              <span className="text-brand-gradient">interviews</span>.
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Scan a posting, tailor your resume, and track follow‑ups in one place — built for job seekers who want momentum.
            </p>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
              <Link
                href="/signup"
                className="bg-brand-gradient inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-primary/30 transition-all hover:brightness-110 hover:shadow-md hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
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
                className="inline-flex items-center justify-center rounded-full border border-border bg-background/60 px-5 py-2.5 text-sm text-foreground/90 transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Explore features
              </a>
            </div>
          </div>

          <div className="mx-auto mt-10 mb-10 sm:mb-12 max-w-5xl">
            <div className="group relative overflow-hidden rounded-3xl border border-border glass shadow-2xl shadow-primary/10 ring-1 ring-white/5 dark:ring-black/10 dark:shadow-black/40">
              {/* Soft brand glow framing the window */}
              <div className="pointer-events-none absolute -inset-px -z-10 bg-gradient-to-br from-primary/15 via-transparent to-[var(--chart-2)]/15" />

              {/* Browser-style chrome */}
              <div className="flex items-center gap-2 border-b border-border/70 px-4 py-2.5">
                <div className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-destructive/70" />
                  <span className="h-3 w-3 rounded-full bg-warning/70" />
                  <span className="h-3 w-3 rounded-full bg-success/70" />
                </div>
                <div className="mx-auto flex items-center gap-1.5 rounded-md bg-muted/60 px-3 py-1 text-xs text-muted-foreground">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  offervia.app/job-packet
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                  </span>
                  Live demo
                </span>
              </div>

              <video
                ref={videoRef}
                className="aspect-[16/9] w-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                controls
                aria-label="Offervia product demo: scan a job description, tailor a resume, and add it to your tracker"
              >
                <source src="/demo.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}