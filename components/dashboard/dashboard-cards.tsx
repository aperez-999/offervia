"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type DashboardApplicationStatus = "Applied" | "Interviewing" | "Offer" | "Rejected";

export function StatusBadge({ status }: { status: DashboardApplicationStatus }) {
  if (status === "Interviewing") {
    return (
      <Badge className="border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-300">
        {status}
      </Badge>
    );
  }
  if (status === "Offer") {
    return (
      <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
        {status}
      </Badge>
    );
  }
  if (status === "Rejected") {
    return <Badge variant="destructive">{status}</Badge>;
  }
  return (
    <Badge className="border border-foreground/10 bg-foreground/[0.06] text-foreground/80 hover:bg-foreground/[0.08]">
      {status}
    </Badge>
  );
}

export function Kpi({
  title,
  value,
  tone = "slate",
}: {
  title: string;
  value: number;
  tone?: "slate" | "indigo" | "blue" | "emerald";
}) {
  const toneClass =
    tone === "indigo"
      ? "bg-indigo-500/10"
      : tone === "blue"
      ? "bg-sky-500/10"
      : tone === "emerald"
      ? "bg-emerald-500/10"
      : "bg-foreground/[0.06]";

  return (
    <Card className="rounded-2xl border border-border bg-card/60 p-3 shadow-sm ring-1 ring-white/5 dark:ring-black/10 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-xs font-medium uppercase tracking-wide text-foreground/60">
          {title}
        </div>
        <div className={`h-2.5 w-2.5 rounded-full ${toneClass}`} aria-hidden />
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
        {value}
      </div>
    </Card>
  );
}

export function ActionCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="h-full rounded-xl border border-border bg-background/60 p-4 shadow-sm transition-all hover:shadow-md">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="mt-1 text-xs text-foreground/70">{children}</div>
    </Card>
  );
}

export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, index) => (
        <li key={index} className="h-10 rounded-md bg-foreground/[0.06]" />
      ))}
    </ul>
  );
}

export function EmptyState({ text, cta }: { text: string; cta?: ReactNode }) {
  return (
    <div className="py-10 text-center">
      <p className="mb-3 text-sm text-foreground/70">{text}</p>
      {cta}
    </div>
  );
}

export function capitalizeFirst(value: string) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
