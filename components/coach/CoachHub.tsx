"use client";

import dynamic from "next/dynamic";
import { Sparkles } from "lucide-react";

const Chat = dynamic(() => import("./Chat"), {
  loading: () => (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <div className="h-[220px] w-full rounded-2xl border border-border bg-card lg:w-[280px]" />
      <div className="h-[70vh] min-h-[400px] flex-1 rounded-2xl border border-border bg-card" />
    </div>
  ),
});

export default function CoachHub() {
  return (
    <div className="space-y-6 py-6 sm:py-8">
      <header className="space-y-1.5">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
          <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-primary/25 to-primary-button/20 text-primary ring-1 ring-primary/20">
            <Sparkles className="size-5" />
          </span>
          AI Coach
        </h1>
        <p className="max-w-2xl text-sm text-foreground/60">
          Pick a module, paste your context, and get concise, actionable coaching
          for interviews, resumes, cover letters, and career moves.
        </p>
      </header>

      <Chat />
    </div>
  );
}
