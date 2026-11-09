"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { captureClientException } from "@/lib/monitoring/sentry";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, Fire, Target } from "@phosphor-icons/react/dist/ssr";
import { AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import QuickStart from "@/components/dashboard/QuickStart";
import ErrorView from "@/components/ErrorView";
import { useToast } from "@/hooks/use-toast";

import type { UsageSnapshot } from "@/lib/usage/read";
import type { ScanAnalytics } from "@/lib/analytics/scan-analytics";
import {
  readJobPacketDraft,
  type JobPacketDraft,
} from "@/lib/job-packet";
import {
  getDashboardNextAction,
} from "@/lib/dashboard/overview";
import {
  ActionCard,
  capitalizeFirst,
  EmptyState,
  Kpi,
  SkeletonList,
  StatusBadge,
} from "@/components/dashboard/dashboard-cards";

type Application = {
  id: string;
  user_id: string;
  company: string;
  position: string;
  status: "Applied" | "Interviewing" | "Offer" | "Rejected";
  applied_on: string;
  follow_up_date?: string | null;
  created_at: string;
};

type MsgRow = {
  id: string;
  user_id: string;
  mode: "interview" | "resume" | "cover_letter" | "career";
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

type OnboardingPrefs = {
  weekly_goal?: number | null;
  onboarding_dismissed?: boolean | null;
  onboarding_completed?: Record<string, boolean> | null;
};

const MODE_LABELS: Record<MsgRow["mode"], string> = {
  interview: "Interview practice",
  resume: "Resume feedback",
  cover_letter: "Cover letter help",
  career: "Career advice",
};

export type { ScanAnalytics };

function HealthStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint: string;
}) {
  return (
    <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="text-xs font-medium text-foreground/60">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
        {value}
        <span className="ml-0.5 text-base font-medium text-foreground/60">%</span>
      </div>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-foreground/60">{hint}</p>
    </Card>
  );
}

const PerformanceInsights = dynamic(
  () => import("@/components/dashboard/PerformanceInsights"),
  { ssr: false }
);

const ApplicationPipeline = dynamic(
  () => import("@/components/dashboard/ApplicationPipeline"),
  { ssr: false }
);

const FollowUpsDue = dynamic(
  () => import("@/components/dashboard/FollowUpsDue"),
  { ssr: false }
);

export default function DashboardClient({
  usage,
  analytics = null,
}: {
  usage: UsageSnapshot;
  analytics?: ScanAnalytics | null;
}) {
  const { toast } = useToast();

  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);
  const [recentChats, setRecentChats] = useState<MsgRow[]>([]);
  const [friendlyName, setFriendlyName] = useState<string>("there");
  const [weeklyGoalTarget, setWeeklyGoalTarget] = useState<number>(5);
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<Record<string, boolean>>({});
  const [jobPacketDraft, setJobPacketDraft] = useState<JobPacketDraft | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setJobPacketDraft(readJobPacketDraft());
  }, []);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const meta = user.user_metadata || {};
        const guess =
          meta.full_name ||
          meta.name ||
          (user.email ? user.email.split("@")[0] : "") ||
          "there";
        setFriendlyName(capitalizeFirst(guess));
      }

      if (!user) {
        setLoading(false);
        return;
      }

      const [prefsRes, appsRes, msgsRes] = await Promise.all([
        supabase
          .from("user_prefs")
          .select("weekly_goal,onboarding_dismissed,onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("applications")
          .select("id,user_id,company,position,status,applied_on,follow_up_date,created_at")
          .eq("user_id", user.id),
        supabase
          .from("messages")
          .select("id,user_id,mode,role,content,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      // Applications are the core of the dashboard — if that query fails,
      // surface a recoverable error instead of rendering a misleading empty state.
      if (appsRes.error) {
        throw appsRes.error;
      }

      const prefs = prefsRes.data;
      const appData = appsRes.data;
      const msgData = msgsRes.data;

      if (prefs) {
        const typed = prefs as unknown as OnboardingPrefs;
        if (typeof typed.weekly_goal === "number" && Number.isFinite(typed.weekly_goal)) {
          setWeeklyGoalTarget(Math.max(0, Math.min(50, Math.round(typed.weekly_goal))));
        }
        if (typeof typed.onboarding_dismissed === "boolean") {
          setOnboardingDismissed(typed.onboarding_dismissed);
        }
        if (typed.onboarding_completed && typeof typed.onboarding_completed === "object") {
          setOnboardingCompleted(typed.onboarding_completed as Record<string, boolean>);
        }
      }

      const normalized = ((appData || []) as Array<Record<string, unknown>>).map((entry) => ({
        ...entry,
        applied_on:
          entry.applied_on && typeof entry.applied_on === "string"
            ? new Date(entry.applied_on).toISOString().slice(0, 10)
            : "",
      })) as Application[];

      normalized.sort((a, b) =>
        b.applied_on > a.applied_on ? 1 : b.applied_on < a.applied_on ? -1 : 0
      );
      setApps(normalized);
      setRecentChats((msgData || []) as MsgRow[]);
      setLoading(false);
    } catch (err) {
      console.error("[dashboard] load failed", err);
      captureClientException(err, { scope: "dashboard.load" });
      setLoadError(true);
      setLoading(false);
      toast({
        title: "Couldn't load your dashboard",
        description: "Check your connection and try again.",
        variant: "destructive",
      });
    }
  }, [supabase, toast]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const { appsThisWeek, interviewing, offers, total } = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const appsThisWeek = apps.filter((a) => {
      if (!a.applied_on) return false;
      const d = new Date(a.applied_on);
      return d >= weekAgo;
    }).length;

    const interviewing = apps.filter((a) => a.status === "Interviewing").length;
    const offers = apps.filter((a) => a.status === "Offer").length;

    return { appsThisWeek, interviewing, offers, total: apps.length };
  }, [apps]);

  const proHealth = useMemo(() => {
    const t = apps.length;
    const interviewingCount = apps.filter((a) => a.status === "Interviewing").length;
    const offersCount = apps.filter((a) => a.status === "Offer").length;
    const rejectedCount = apps.filter((a) => a.status === "Rejected").length;
    const pct = (n: number) => (t > 0 ? Math.round((n / t) * 100) : 0);
    return {
      responseRate: pct(interviewingCount + offersCount + rejectedCount),
      interviewRate: pct(interviewingCount),
      offerRate: pct(offersCount),
    };
  }, [apps]);

  const weeklyGoalPct = Math.max(
    0,
    Math.min(100, Math.round((appsThisWeek / weeklyGoalTarget) * 100))
  );

  const streak = useMemo(() => {
    const set = new Set(
      apps
        .filter((a) => a.applied_on)
        .map((a) => a.applied_on.slice(0, 10))
    );
    let s = 0;
    const oneDay = 24 * 60 * 60 * 1000;
    let cursor = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      new Date().getDate()
    );
    while (s < 365) {
      const key = cursor.toISOString().slice(0, 10);
      if (set.has(key)) {
        s++;
        cursor = new Date(cursor.getTime() - oneDay);
      } else {
        break;
      }
    }
    return s;
  }, [apps]);

  const nextAction = useMemo(
    () =>
      getDashboardNextAction({
        jobPacketDraft,
        appsThisWeek,
        recentChatsCount: recentChats.length,
      }),
    [appsThisWeek, jobPacketDraft, recentChats.length]
  );


  const onboardingItems = useMemo(() => {
    const items = [
      { key: "add_application", label: "Add your first application", href: "/tracker", done: apps.length > 0 },
      { key: "scan_jd", label: "Run a job scan", href: "/scanner", done: usage.jobScans > 0 },
      { key: "tailor_resume", label: "Tailor a resume", href: "/resume", done: usage.resumeTailor > 0 },
      { key: "coach_chat", label: "Ask the coach something", href: "/coach", done: usage.coachMessages > 0 },
      { key: "mock_interview", label: "Run a mock interview", href: "/interview", done: usage.interviewSessions > 0 },
      { key: "set_weekly_goal", label: "Set a weekly goal", href: "/settings", done: weeklyGoalTarget > 0 },
    ];
    return items.map((it) => ({
      ...it,
      done: it.done || onboardingCompleted[it.key] === true,
    }));
  }, [apps.length, onboardingCompleted, usage, weeklyGoalTarget]);

  const onboardingProgress = useMemo(() => {
    const total = onboardingItems.length || 1;
    const done = onboardingItems.filter((i) => i.done).length;
    return { done, total, pct: Math.round((done / total) * 100) };
  }, [onboardingItems]);

  async function persistOnboarding(next: { dismissed?: boolean; completed?: Record<string, boolean> }) {
    const merged = {
      dismissed: next.dismissed ?? onboardingDismissed,
      completed: next.completed ?? onboardingCompleted,
    };
    setOnboardingDismissed(merged.dismissed);
    setOnboardingCompleted(merged.completed);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) return;
      const { error } = await supabase
        .from("user_prefs")
        .upsert(
          ({
            user_id: user.id,
            onboarding_dismissed: merged.dismissed,
            onboarding_completed: merged.completed,
          } satisfies Record<string, unknown>),
          { onConflict: "user_id" }
        );
      // ignore missing-column errors safely
      if (error) {
        // noop
      }
    } catch {
      // noop
    }
  }

  if (loadError && !loading) {
    return (
      <div className="space-y-8">
        <ErrorView
          title="Couldn't load your dashboard"
          description="Your applications didn't load. Check your connection and try again."
          onRetry={loadDashboard}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">

      <section>
        <Card className="relative overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-sm">
          <CardContent className="relative p-5 sm:p-6">
            <div className="max-w-3xl">
              <Badge className="border border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
                Dashboard
              </Badge>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Welcome back,{" "}
                <span className="text-primary">{friendlyName}</span>
              </h1>
              <p className="mt-2 text-sm text-foreground/75 sm:text-base">
                Here&apos;s where your applications stand and what to do next.
              </p>
            </div>

            {/* Recommended next step: full-width band, CTA inline */}
            <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-background/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <ArrowRight className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-primary/80">
                    Next step
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-foreground">{nextAction.title}</div>
                  <div className="mt-0.5 text-sm text-foreground/70">{nextAction.desc}</div>
                </div>
              </div>
              <Link href={nextAction.href} className="shrink-0">
                <Button className="w-full cursor-pointer bg-primary-button text-primary-button-foreground shadow-sm hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto sm:px-6">
                  {nextAction.cta}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Quick start (dismissable) */}
      <AnimatePresence initial={false}>
        {!onboardingDismissed && onboardingProgress.done < onboardingProgress.total && (
          <QuickStart
            items={onboardingItems}
            done={onboardingProgress.done}
            total={onboardingProgress.total}
            pct={onboardingProgress.pct}
            onDismiss={() => persistOnboarding({ dismissed: true })}
          />
        )}
      </AnimatePresence>

      {/* At-a-glance stats */}
      <section className="space-y-3">
        <div>
          <div className="text-xs font-semibold text-foreground/60">
            Overview
          </div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Your applications</h2>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Reveal index={0}><Kpi title="Total applications" value={total} tone="slate" /></Reveal>
          <Reveal index={1}><Kpi title="Sent this week" value={appsThisWeek} tone="indigo" /></Reveal>
          <Reveal index={2}><Kpi title="Interviewing" value={interviewing} tone="blue" /></Reveal>
          <Reveal index={3}><Kpi title="Offers" value={offers} tone="emerald" /></Reveal>
        </div>
      </section>

      {/* Pro: pipeline health */}
      {!loading && total > 0 ? (
        <section className="space-y-3">
          <div>
            <div className="text-xs font-semibold text-foreground/60">
              Pipeline health
            </div>
            <h2 className="mt-1 text-lg font-semibold text-foreground">How your applications are doing</h2>
          </div>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
            <HealthStat label="Response rate" value={proHealth.responseRate} hint="Applications that got any reply, including rejections" />
            <HealthStat label="Interview rate" value={proHealth.interviewRate} hint="Applications now in the interview stage" />
            <HealthStat label="Offer rate" value={proHealth.offerRate} hint="Applications that became an offer" />
          </div>
        </section>
      ) : null}

      {/* KPIs + Goal/Streak */}
      <section className="space-y-3">
        <div>
          <div className="text-xs font-semibold text-foreground/60">
            Progress
          </div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">This week</h2>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-foreground/60">
                  Weekly goal
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
                    {appsThisWeek}/{weeklyGoalTarget}
                  </span>
                  <span className="text-xs text-foreground/60">applications</span>
                </div>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Target className="h-4.5 w-4.5" />
              </span>
            </div>
            <Progress value={weeklyGoalPct} className="mt-3 h-2" />
            <div className="mt-2 text-xs text-foreground/60">
              {weeklyGoalTarget > 0 && appsThisWeek >= weeklyGoalTarget ? (
                <span>You hit your goal for this week.</span>
              ) : (
                <span>
                  {Math.max(0, weeklyGoalTarget - appsThisWeek)} to go this week.{" "}
                  <Link href="/tracker" className="underline text-primary">
                    Log an application
                  </Link>
                  .
                </span>
              )}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-foreground/60">
                  Streak
                </div>
                <div className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                  {streak} day{streak === 1 ? "" : "s"}
                </div>
                <p className="mt-1 text-xs text-foreground/60">
                  Days in a row with at least one application logged.
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning ring-1 ring-warning/15">
                <Fire className="h-4.5 w-4.5" />
              </span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="text-xs font-medium text-foreground/60">This month</div>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Job scans", usage.jobScans],
                ["Tailored resumes", usage.resumeTailor],
                ["Cover letters", usage.coverLetters],
                ["Mock interviews", usage.interviewSessions],
                ["Coach messages", usage.coachMessages],
              ].map(([label, count]) => (
                <div key={label} className="flex items-center justify-between gap-2">
                  <dt className="text-foreground/80">{label}</dt>
                  <dd className="font-medium tabular-nums text-foreground">{count}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </section>

      {!loading && total > 0 && <FollowUpsDue apps={apps} />}

      {!loading && total > 0 && <ApplicationPipeline apps={apps} />}

      {/* Activity (main) + secondary rail */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Two-up: Recent Applications + Recent Chats */}
          <section className="space-y-3">
        <div>
          <div className="text-xs font-semibold text-foreground/60">
            Recent activity
          </div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Latest applications and chats</h2>
        </div>
        <div className="grid items-start gap-4 grid-cols-1 2xl:grid-cols-2">
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">
                  Recent applications
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  Your 5 most recent
                </CardDescription>
              </div>
              <Link href="/tracker">
                <Button
                  variant="outline"
                  className="cursor-pointer border-border text-foreground hover:bg-foreground/[0.06]"
                >
                  View all
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonList rows={5} />
            ) : apps.length === 0 ? (
              <EmptyState
                text="Applications you add will show up here."
                cta={
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link href="/job-packet">
                      <Button className="bg-primary-button text-primary-button-foreground hover:bg-primary-button/90">Start Job Packet</Button>
                    </Link>
                    <Link href="/tracker">
                      <Button variant="outline" className="border-border text-foreground hover:bg-foreground/[0.06]">
                        Add manually
                      </Button>
                    </Link>
                  </div>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {apps.slice(0, 5).map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {a.company}
                      </div>
                      <div className="truncate text-xs text-foreground/70">
                        {a.position}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="hidden text-xs text-foreground/70 sm:block">
                        {a.applied_on}
                      </div>
                      <StatusBadge status={a.status} />
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="hidden border-border text-foreground hover:bg-foreground/[0.06] sm:inline-flex"
                      >
                        <Link href="/tracker">Manage</Link>
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">
                  Recent coach chats
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  Your latest messages
                </CardDescription>
              </div>
              <Link href="/coach">
                <Button
                  variant="outline"
                  className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.06]"
                >
                  Open coach
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <SkeletonList rows={5} />
            ) : recentChats.length === 0 ? (
              <EmptyState
                text="Your coach conversations will show up here."
                cta={
                  <Link href="/coach">
                    <Button className="cursor-pointer">Open coach</Button>
                  </Link>
                }
              />
            ) : (
              <ul className="divide-y divide-border">
                {recentChats.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-foreground">
                        {MODE_LABELS[m.mode]}: {m.role === "user" ? "You" : "Coach"}
                      </div>
                      <div className="truncate text-xs text-foreground/70">
                        {m.content}
                      </div>
                    </div>
                    <Link href="/coach">
                      <Button
                        variant="ghost"
                        className="text-primary hover:bg-primary/10"
                      >
                        Open
                      </Button>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        </div>
      </section>
        </div>

        <div className="space-y-6">
      {/* Quick actions */}
      <section>
        <Card className="rounded-2xl border border-border bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Link href="/job-packet" className="block">
                <ActionCard title="Start Job Packet">
                  Scan a job description, tailor your resume, and log the application in one flow.
                </ActionCard>
              </Link>
              <Link href="/resume" className="block">
                <ActionCard title="Tailor resume">
                  Rewrite your resume for a specific job.
                </ActionCard>
              </Link>
              <Link href="/scanner" className="block">
                <ActionCard title="Scan a job description">
                  See which keywords the posting wants and which ones your resume is missing.
                </ActionCard>
              </Link>
              <Link href="/interview" className="block">
                <ActionCard title="Practice interview">
                  Answer mock interview questions for your target role and get a score.
                </ActionCard>
              </Link>
              <Link href="/tracker" className="block">
                <ActionCard title="Open tracker">
                  See every application you&apos;ve sent and its status.
                </ActionCard>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
        </div>
      </div>

      {/* Scan insights */}
      {analytics ? <PerformanceInsights analytics={analytics} /> : null}
    </div>
  );
}
