"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarClock, ArrowRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Reveal } from "@/components/motion/Reveal";

export type FollowUpApp = {
  id: string;
  company: string;
  position: string;
  status: "Applied" | "Interviewing" | "Offer" | "Rejected";
  follow_up_date?: string | null;
};

const ACTIVE = new Set(["Applied", "Interviewing"]);

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function relativeLabel(dateIso: string, today: string) {
  if (dateIso < today) {
    const days = Math.max(
      1,
      Math.round(
        (Date.parse(today) - Date.parse(dateIso)) / 86_400_000,
      ),
    );
    return `${days}d overdue`;
  }
  return "Due today";
}

export default function FollowUpsDue({ apps }: { apps: FollowUpApp[] }) {
  const { due, overdueCount } = useMemo(() => {
    const today = todayIso();
    const list = apps
      .filter(
        (a) =>
          ACTIVE.has(a.status) &&
          typeof a.follow_up_date === "string" &&
          a.follow_up_date.length >= 10 &&
          a.follow_up_date.slice(0, 10) <= today,
      )
      .sort((a, b) =>
        String(a.follow_up_date).localeCompare(String(b.follow_up_date)),
      );
    const overdueCount = list.filter(
      (a) => String(a.follow_up_date).slice(0, 10) < today,
    ).length;
    return { due: list.slice(0, 6), overdueCount };
  }, [apps]);

  if (due.length === 0) return null;

  const today = todayIso();

  return (
    <Reveal>
      <Card className="border-amber-500/30 bg-amber-500/[0.04] dark:bg-amber-400/[0.03]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400">
                <CalendarClock className="size-4" />
              </span>
              <div>
                <CardTitle className="text-base">Follow-ups due</CardTitle>
                <CardDescription>
                  {overdueCount > 0
                    ? `${overdueCount} overdue, ${due.length - overdueCount} due today`
                    : `${due.length} due today`}
                </CardDescription>
              </div>
            </div>
            <Link
              href="/tracker"
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              Open tracker <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="space-y-2">
            {due.map((a) => {
              const date = String(a.follow_up_date).slice(0, 10);
              const overdue = date < today;
              return (
                <li key={a.id}>
                  <Link
                    href="/tracker"
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/60 bg-background/60 px-3 py-2 transition-colors hover:border-border hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {a.company}
                      </span>
                      <span className="block truncate text-xs text-foreground/60">
                        {a.position} · {a.status}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                        overdue
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                      }`}
                    >
                      {relativeLabel(date, today)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </Reveal>
  );
}
