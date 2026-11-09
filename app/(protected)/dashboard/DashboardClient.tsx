"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BellRinging, CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorView from "@/components/ErrorView";
import QuickStart from "@/components/dashboard/QuickStart";
import { StatusBadge } from "@/components/dashboard/dashboard-cards";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { readJobPacketDraft, type JobPacketDraft } from "@/lib/job-packet";
import {
  dueFollowUps,
  getDashboardNextAction,
  localIsoDate,
  summarizeApplications,
} from "@/lib/dashboard/overview";
import type { UsageSnapshot } from "@/lib/usage/read";

const RECENT = 5;
const DUE = 3;

function formatDate(iso: string) {
  if (!iso) return "";
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SectionTitle({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-base font-semibold text-foreground">{children}</h2>
      {action}
    </div>
  );
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1 rounded text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {children}
      <ArrowRight className="size-3.5 transition-transform duration-200 motion-safe:group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

export default function DashboardClient({
  usage,
  hasSavedResume = false,
}: {
  usage: UsageSnapshot;
  hasSavedResume?: boolean;
}) {
  const data = useDashboardData();
  const [draft, setDraft] = useState<JobPacketDraft | null>(null);
  useEffect(() => setDraft(readJobPacketDraft()), []);

  const summary = useMemo(() => summarizeApplications(data.apps), [data.apps]);
  const due = useMemo(() => dueFollowUps(data.apps, localIsoDate()), [data.apps]);
  const next = useMemo(
    () => getDashboardNextAction({ jobPacketDraft: draft, appsThisWeek: summary.thisWeek, recentChatsCount: data.hasChats ? 1 : 0 }),
    [draft, summary.thisWeek, data.hasChats]
  );

  const checklist = useMemo(() => {
    const items = [
      { key: "add_application", label: "Add your first application", href: "/job-packet", done: data.apps.length > 0 },
      { key: "save_resume", label: "Save My resume", href: "/profile#my-resume", done: hasSavedResume },
      { key: "scan_jd", label: "Scan a job posting", href: "/scanner", done: usage.jobScans > 0 },
      { key: "mock_interview", label: "Try a mock interview", href: "/interview", done: usage.interviewSessions > 0 },
    ];
    return items.map((it) => ({ ...it, done: it.done || data.onboardingCompleted[it.key] === true }));
  }, [data.apps.length, data.onboardingCompleted, usage, hasSavedResume]);
  const checklistDone = checklist.filter((i) => i.done).length;

  if (data.error && !data.loading) {
    return (
      <div className="py-6">
        <ErrorView
          title="Couldn't load your applications"
          description="Check your connection and try again."
          onRetry={data.reload}
        />
      </div>
    );
  }

  const goal = data.weeklyGoal;
  const goalPct = goal > 0 ? Math.min(100, Math.round((summary.thisWeek / goal) * 100)) : 0;
  const isNew = !data.loading && data.apps.length === 0;

  return (
    <div className="space-y-8 py-6 sm:py-8">
      {/* Greeting and the one thing to do next */}
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {data.firstName ? `Hi, ${data.firstName}` : "Welcome back"}
        </h1>
        <div className="flex flex-col gap-4 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="min-w-0">
            <p className="font-medium text-foreground">{next.title}</p>
            <p className="mt-0.5 text-sm text-foreground/75">{next.desc}</p>
          </div>
          <Button asChild className="shrink-0 sm:px-6">
            <Link href={next.href}>{next.cta}</Link>
          </Button>
        </div>
      </section>

      {/* Follow-ups that are due */}
      {due.length > 0 ? (
        <section className="space-y-3" aria-labelledby="due-heading">
          <SectionTitle
            action={due.length > DUE ? <TextLink href="/tracker">All {due.length}</TextLink> : undefined}
          >
            <span id="due-heading" className="inline-flex items-center gap-2">
              <BellRinging className="size-[18px] text-warning" weight="duotone" aria-hidden />
              Time to follow up
            </span>
          </SectionTitle>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {due.slice(0, DUE).map(({ app, label }) => (
              <li key={app.id}>
                <Link
                  href={`/tracker/${app.id}`}
                  className="flex items-center justify-between gap-3 px-4 py-3 transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-foreground">{app.company}</span>
                    <span className="block truncate text-sm text-muted-foreground">{app.position}</span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2 text-sm text-warning">
                    {label}
                    <CaretRight className="size-4 text-muted-foreground" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {data.loading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : isNew ? (
        !data.onboardingDismissed && checklistDone < checklist.length ? (
          <QuickStart
            items={checklist}
            done={checklistDone}
            total={checklist.length}
            pct={Math.round((checklistDone / checklist.length) * 100)}
            onDismiss={() => data.saveOnboarding({ dismissed: true })}
          />
        ) : null
      ) : (
        <>
          {/* Your search at a glance */}
          <section className="space-y-3" aria-labelledby="search-heading">
            <SectionTitle action={<TextLink href="/dashboard/insights">See insights</TextLink>}>
              <span id="search-heading">Your search</span>
            </SectionTitle>
            <div className="rounded-2xl border border-border p-4 sm:p-5">
              <dl className="grid grid-cols-3 gap-4">
                {[
                  ["Applied", summary.total],
                  ["Interviewing", summary.interviewing],
                  ["Offers", summary.offers],
                ].map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-sm text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 font-display text-3xl font-semibold tabular-nums text-foreground">
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>
              {goal > 0 ? (
                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="text-foreground/80">This week</span>
                    <span className="tabular-nums text-muted-foreground">
                      {summary.thisWeek} of {goal}
                    </span>
                  </div>
                  <div
                    className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label="Weekly goal"
                    aria-valuemin={0}
                    aria-valuemax={goal}
                    aria-valuenow={summary.thisWeek}
                  >
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 ease-[var(--ease-out-quint)] ${goalPct >= 100 ? "bg-highlight" : "bg-primary"}`}
                      style={{ width: `${goalPct}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </section>

          {/* Most recent applications */}
          <section className="space-y-3" aria-labelledby="recent-heading">
            <SectionTitle action={<TextLink href="/tracker">View all</TextLink>}>
              <span id="recent-heading">Recent applications</span>
            </SectionTitle>
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {data.apps.slice(0, RECENT).map((app) => (
                <li key={app.id}>
                  <Link
                    href={`/tracker/${app.id}`}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1 px-4 py-3 transition-colors duration-150 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[1fr_auto_5rem]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{app.company}</span>
                      <span className="block truncate text-sm text-muted-foreground">{app.position}</span>
                    </span>
                    <StatusBadge status={app.status} />
                    <span className="hidden text-right text-sm tabular-nums text-muted-foreground sm:block">
                      {formatDate(app.applied_on)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
