"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function BottomCta() {
  return (
    <section className="bg-gradient-to-b from-indigo-50 to-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl border border-gray-200 bg-white/70 p-6 text-center shadow-sm backdrop-blur"
        >
          <h3 className="text-2xl font-semibold text-gray-900">Ready to land more offers?</h3>
          <p className="mt-2 text-sm text-gray-600">Start for free — no credit card required.</p>
          <div className="mt-6">
            <Link href="/signup" className="inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
              Get Started Now
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
