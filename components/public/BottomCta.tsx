"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function BottomCta() {
  return (
    // Light: white; Dark: true black (no light band left over)
    <section className="bg-white dark:bg-black">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className={[
            "rounded-2xl border border-border shadow-sm backdrop-blur-sm ring-2",
            // Glass base
            "bg-white/70 dark:bg-neutral-900/40",
            // Subtle indigo tint & ring (consistent with other sections)
            "ring-primary/20",
            "p-6 text-center",
          ].join(" ")}
        >
          <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Ready to land more offers?
          </h3>
          <p className="mt-2 text-sm text-gray-700 dark:text-white">
            Start for free — no credit card required.
          </p>

          <div className="mt-6">
            <Link
              href="/signup"
              className={[
                "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
                "bg-primary text-white hover:bg-primary/90",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "ring-offset-background",
              ].join(" ")}
            >
              Get Started Now
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}