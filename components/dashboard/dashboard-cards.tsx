"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export type DashboardApplicationStatus = "Applied" | "Interviewing" | "Offer" | "Rejected";

export function StatusBadge({ status }: { status: DashboardApplicationStatus }) {
  if (status === "Interviewing") {
    return <Badge variant="interviewing">{status}</Badge>;
  }
  if (status === "Offer") {
    return <Badge variant="offer">{status}</Badge>;
  }
  if (status === "Rejected") {
    return <Badge variant="rejected">{status}</Badge>;
  }
  return <Badge variant="applied">{status}</Badge>;
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
      ? "bg-primary"
      : tone === "blue"
      ? "bg-[var(--status-applied)]"
      : tone === "emerald"
      ? "bg-[var(--status-offer)]"
      : "bg-muted-foreground/40";

  return (
    <Card className="card-hover rounded-2xl border border-border bg-card p-3 shadow-sm ring-1 ring-white/5 dark:ring-black/10 sm:p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="truncate text-xs font-medium text-foreground/60">
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
    <Card className="card-hover h-full rounded-xl border border-border bg-background/60 p-4 shadow-sm">
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
