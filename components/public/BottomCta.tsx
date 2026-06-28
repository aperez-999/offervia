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
          className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/[0.10] via-card/70 to-card/60 p-8 text-center shadow-xl shadow-primary/10 ring-1 ring-primary/20 sm:p-12"
        >
          <div aria-hidden className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-brand/15 blur-3xl" />
          <div className="relative">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
              Ready to land more offers?
            </h3>
            <p className="mx-auto mt-3 max-w-lg text-sm text-foreground/70 sm:text-base">
              Start for free — no credit card required. Scan, tailor, and track your search in one place.
            </p>

            <div className="mt-8">
              <Link
                href="/signup"
                className="bg-brand-gradient inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white shadow-sm shadow-primary/30 transition-all hover:brightness-110 hover:shadow-md hover:shadow-primary/40 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              >
                Get started — free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
