"use client";

import dynamic from "next/dynamic";
import { ChatCircleText } from "@phosphor-icons/react/dist/ssr";
import { Skeleton } from "@/components/ui/skeleton";

const Chat = dynamic(() => import("./Chat"), {
  loading: () => (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6">
      <aside className="w-full shrink-0 lg:w-[280px]">
        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <Skeleton className="h-3 w-24" />
          <div className="my-2 h-px bg-border" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-md" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </div>
        </div>
      </aside>
      <div className="flex h-[70vh] min-h-[400px] flex-1 flex-col rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-4 w-72" />
        </div>
        <div className="flex-1 space-y-4 overflow-hidden p-5">
          <div className="flex items-start gap-2">
            <Skeleton className="mt-1 h-5 w-5 rounded-full" />
            <div className="rounded-2xl border border-border bg-background/70 p-3">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="mt-2 h-4 w-44" />
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="ml-auto rounded-2xl border border-border bg-background/70 p-3">
              <Skeleton className="h-4 w-56" />
            </div>
          </div>
        </div>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-11 w-full rounded-md" />
            <Skeleton className="h-11 w-24 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  ),
});

export default function CoachHub() {
  return (
    <div className="space-y-6 py-6 sm:py-8">
      <header className="space-y-1.5">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
          <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
            <ChatCircleText className="size-5" />
          </span>
          AI coach
        </h1>
        <p className="max-w-2xl text-sm text-foreground/60">
          Pick a topic and paste what you&apos;re working on: an interview answer, a resume
          bullet, a cover letter paragraph, or a career decision.
        </p>
      </header>

      <Chat />
    </div>
  );
}
