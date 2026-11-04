"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function BottomCta() {
  return (
    <section className="bg-background">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-8 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-10"
        >
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
              Try it on the next job you apply to.
            </h2>
            <p className="mt-2 max-w-lg text-sm text-foreground/70 text-pretty sm:text-base">
              Free to start. No credit card needed.
            </p>
          </div>

          <Link
            href="/signup"
            className="group bg-brand-gradient inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 motion-safe:active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            Create a free account
            <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
