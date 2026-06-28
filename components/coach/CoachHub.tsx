"use client";

import dynamic from "next/dynamic";

const Chat = dynamic(() => import("./Chat"), {
  loading: () => (
    <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
      <div className="h-6 w-40 rounded bg-foreground/10" />
      <div className="mt-3 space-y-2">
        <div className="h-20 rounded bg-foreground/5" />
        <div className="h-20 rounded bg-foreground/5" />
      </div>
    </div>
  ),
});

export default function CoachHub() {
  return (
    <div className="space-y-8 py-6 sm:py-8">
      <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Coach</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Pick a module, paste context, and get concise coaching you can act on.
        </p>
      </div>

      <Chat />
    </div>
  );
}
