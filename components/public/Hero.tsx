"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* abstract gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-72 w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-r from-indigo-200 via-indigo-100 to-transparent blur-3xl" />
        <div className="absolute top-40 -left-40 h-56 w-56 rounded-full bg-indigo-100/60 blur-2xl" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto w-fit rounded-full border border-indigo-200 bg-white/90 px-3 py-1 text-xs font-medium text-indigo-700 shadow-sm">
            Free for Job Seekers • No credit card required
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Land the Offer. Not Just an Interview.
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Offervia helps you prepare, tailor, and apply with confidence across interviews, resumes, and job descriptions.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup" className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Get Started – Free
            </Link>
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById("features");
                if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="rounded-md px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              Explore Features
            </a>
          </div>
          {/* muted mockup placeholder */}
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white/60 p-4 shadow-lg backdrop-blur">
            <div className="aspect-[16/9] w-full rounded-xl border border-dashed border-gray-300 bg-gradient-to-b from-gray-50 to-white" />
            <p className="mt-2 text-xs text-gray-500">Product preview placeholder</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
