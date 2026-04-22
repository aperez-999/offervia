"use client";

import Chat from "./Chat";
import { motion } from "framer-motion";

export default function CoachHub() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="p-4 sm:p-6 space-y-4 sm:space-y-6"
    >
      <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Coach</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Pick a module, paste context, and get concise coaching you can act on.
        </p>
      </div>

      <Chat />
    </motion.div>
  );
}
