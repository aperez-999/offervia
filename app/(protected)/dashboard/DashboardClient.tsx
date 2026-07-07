"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

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
import { Flame, Sparkles, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import QuickStart from "@/components/dashboard/QuickStart";

import type { UsageSnapshot } from "@/lib/usage/read";
import type { ScanAnalytics } from "@/lib/analytics/scan-analytics";
import {
  readJobPacketDraft,
  type JobPacketDraft,
} from "@/lib/job-packet";
import {
  getDashboardNextAction,
  getDashboardUsageItems,
} from "@/lib/dashboard/overview";
import {
  ActionCard,
  capitalizeFirst,
  EmptyState,
  Kpi,
  SkeletonList,
  StatusBadge,
} from "@/components/dashboard/dashboard-cards";

type PlanLimits = {
  resume_tailor_per_month: number;
  coach_messages_per_month: number;
  job_scans_per_month: number;
  interview_sessions_per_month: number;
  cover_letters_per_month: number;
};

type Application = {
  id: string;
  user_id: string;
  company: string;
  position: string;
  status: "Applied" | "Interviewing" | "Offer" | "Rejected";
  applied_on: string;
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
  email_digest?: boolean | null;
  onboarding_dismissed?: boolean | null;
  onboarding_completed?: Record<string, boolean> | null;
};

const MODE_LABELS: Record<MsgRow["mode"], string> = {
  interview: "Interview Coach",
  resume: "Resume Feedback",
  cover_letter: "Cover Letter Help",
  career: "Career Advice",
};

type PlanType = "free" | "pro";

export type { ScanAnalytics };

const PerformanceInsights = dynamic(
  () => import("@/components/dashboard/PerformanceInsights"),
  { ssr: false }
);

const ApplicationPipeline = dynamic(
  () => import("@/components/dashboard/ApplicationPipeline"),
  { ssr: false }
);

export default function DashboardClient({
  plan = "free",
  usage,
  limits,
  analytics = null,
}: {
  plan?: PlanType;
  usage: UsageSnapshot;
  limits: PlanLimits;
  analytics?: ScanAnalytics | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const upgrade = searchParams.get("upgrade");

  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);
  const [recentChats, setRecentChats] = useState<MsgRow[]>([]);
  const [friendlyName, setFriendlyName] = useState<string>("there");
  const [weeklyGoalTarget, setWeeklyGoalTarget] = useState<number>(5);
  const [emailDigestEnabled, setEmailDigestEnabled] = useState<boolean>(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState<boolean>(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<Record<string, boolean>>({});
  const [jobPacketDraft, setJobPacketDraft] = useState<JobPacketDraft | null>(null);

  function dismissUpgradeBanner() {
    router.replace("/dashboard");
  }

  useEffect(() => {
    setJobPacketDraft(readJobPacketDraft());
  }, []);

  useEffect(() => {
    (async () => {
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

      const [{ data: prefs }, { data: appData }, { data: msgData }] = await Promise.all([
        supabase
          .from("user_prefs")
          .select("weekly_goal,email_digest,onboarding_dismissed,onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("applications")
          .select("id,user_id,company,position,status,applied_on,created_at")
          .eq("user_id", user.id),
        supabase
          .from("messages")
          .select("id,user_id,mode,role,content,created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

      if (prefs) {
        const typed = prefs as unknown as OnboardingPrefs;
        if (typeof typed.weekly_goal === "number" && Number.isFinite(typed.weekly_goal)) {
          setWeeklyGoalTarget(Math.max(0, Math.min(50, Math.round(typed.weekly_goal))));
        }
        if (typeof typed.email_digest === "boolean") {
          setEmailDigestEnabled(typed.email_digest);
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
    })();
  }, [supabase]);

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

  const usageItems = useMemo(
    () =>
      getDashboardUsageItems({
        usage: {
          resumeTailor: usage.resumeTailor,
          coachMessages: usage.coachMessages,
          jobScans: usage.jobScans,
          interviewSessions: usage.interviewSessions,
          coverLetters: usage.coverLetters,
        },
        limits,
      }),
    [limits, usage.coachMessages, usage.jobScans, usage.resumeTailor, usage.interviewSessions, usage.coverLetters]
  );

  const nearingLimit = useMemo(
    () =>
      plan === "free" &&
      usageItems.some((item) => item.state === "warn" || item.state === "high"),
    [plan, usageItems]
  );

  const onboardingItems = useMemo(() => {
    const items = [
      { key: "add_application", label: "Add your first application", href: "/tracker", done: apps.length > 0 },
      { key: "scan_jd", label: "Run a job scan", href: "/scanner", done: usage.jobScans > 0 },
      { key: "tailor_resume", label: "Tailor a resume", href: "/resume", done: usage.resumeTailor > 0 },
      { key: "coach_chat", label: "Ask the coach something", href: "/coach", done: usage.coachMessages > 0 },
      { key: "mock_interview", label: "Run a mock interview", href: "/interview", done: usage.interviewSessions > 0 },
      { key: "set_weekly_goal", label: "Set a weekly goal", href: "/settings", done: weeklyGoalTarget > 0 },
      { key: "enable_digest", label: "Enable weekly digest", href: "/settings", done: emailDigestEnabled },
    ];
    return items.map((it) => ({
      ...it,
      done: it.done || onboardingCompleted[it.key] === true,
    }));
  }, [apps.length, emailDigestEnabled, onboardingCompleted, usage, weeklyGoalTarget]);

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

  return (
    <div className="space-y-8">
      {/* Upgrade success / cancel banner */}
      {upgrade === "success" && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-success">
          <p className="text-sm font-medium">
            🎉 Welcome to Pro! Your limits have been unlocked.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 rounded-full p-0 text-success hover:bg-success/20"
            onClick={dismissUpgradeBanner}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      {upgrade === "cancel" && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/50 px-4 py-3 text-muted-foreground">
          <p className="text-sm">
            Upgrade was canceled. You can try again anytime.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 rounded-full p-0 hover:bg-foreground/[0.06]"
            onClick={dismissUpgradeBanner}
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <section>
        <Card className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.06] via-card/60 to-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
          <CardContent className="relative p-5 sm:p-6">
            <div className="max-w-3xl">
              <Badge className="border border-primary/30 bg-primary/10 text-primary hover:bg-primary/10">
                Continue your search
              </Badge>
              <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                Welcome back,{" "}
                <span className="text-primary">{friendlyName}</span>
              </h1>
              <p className="mt-2 text-sm text-foreground/75 sm:text-base">
                One clear next step beats a crowded dashboard. Keep the workflow moving with the action that matters most right now.
              </p>
            </div>

            {/* Recommended next step — full-width band, CTA inline */}
            <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-primary/20 bg-background/70 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                    Recommended next step
                  </div>
                  <div className="mt-0.5 text-sm font-medium text-foreground">{nextAction.title}</div>
                  <div className="mt-0.5 text-sm text-foreground/70">{nextAction.desc}</div>
                </div>
              </div>
              <Link href={nextAction.href} className="shrink-0">
                <Button className="w-full cursor-pointer bg-primary text-white shadow-sm hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:w-auto sm:px-6">
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
          <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Overview
          </div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">At a glance</h2>
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Reveal index={0}><Kpi title="Applications (total)" value={total} tone="slate" /></Reveal>
          <Reveal index={1}><Kpi title="Applications (this week)" value={appsThisWeek} tone="indigo" /></Reveal>
          <Reveal index={2}><Kpi title="Interviewing" value={interviewing} tone="blue" /></Reveal>
          <Reveal index={3}><Kpi title="Offers" value={offers} tone="emerald" /></Reveal>
        </div>
      </section>

      {/* KPIs + Goal/Streak */}
      <section className="space-y-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Progress
          </div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Keep the search on track</h2>
        </div>
        <div className="grid items-start gap-4 lg:grid-cols-3">
          <Card className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  Weekly Goal
                </div>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-xl font-semibold tabular-nums text-foreground sm:text-2xl">
                    {appsThisWeek}/{weeklyGoalTarget}
                  </span>
                  <span className="text-xs text-foreground/60">applications</span>
                </div>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/15">
                <Sparkles className="h-4.5 w-4.5" />
              </span>
            </div>
            <Progress value={weeklyGoalPct} className="mt-3 h-2" />
            <div className="mt-2 text-xs text-foreground/60">
              {emailDigestEnabled ? (
                <span>Weekly digest is on.</span>
              ) : (
                <span>
                  Weekly digest is off.{" "}
                  <Link href="/settings" className="underline text-primary">
                    Enable it in settings
                  </Link>
                  .
                </span>
              )}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  Streak
                </div>
                <div className="mt-1 text-xl font-semibold text-foreground sm:text-2xl">
                  {streak} day{streak === 1 ? "" : "s"}
                </div>
                <p className="mt-1 text-xs text-foreground/60">
                  Keep up the momentum with one small action today.
                </p>
              </div>
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/15">
                <Flame className="h-4.5 w-4.5" />
              </span>
            </div>
          </Card>

          <Card className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  Usage This Month
                </div>
                <p className="mt-1 text-sm text-foreground/70">
                  A quick read on how much room you have left in the current cycle.
                </p>
              </div>
              {nearingLimit && plan === "free" ? (
                <Badge className="border border-warning/30 bg-warning/10 text-warning hover:bg-warning/10">
                  Near limit
                </Badge>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {usageItems.map((item) => (
                <div key={item.key}>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-foreground/80">{item.label}</span>
                    <span
                      className={
                        item.state === "high"
                          ? "font-medium text-destructive"
                          : item.state === "warn"
                          ? "font-medium text-warning"
                          : "font-medium text-foreground"
                      }
                    >
                      {item.unlimited ? `${item.used} / ∞` : `${item.used} / ${item.limit}`}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-foreground/10">
                    <div
                      className={
                        "h-full rounded-full transition-all " +
                        (item.state === "high"
                          ? "bg-destructive"
                          : item.state === "warn"
                          ? "bg-warning"
                          : "bg-primary")
                      }
                      style={{ width: `${item.unlimited ? 6 : item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {nearingLimit && plan === "free" ? (
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-foreground/80">
                  You&apos;re getting close to a monthly limit. Upgrade if you want to keep the workflow moving without interruption.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-warning/30 bg-warning/10 text-warning hover:bg-warning/20"
                  onClick={() => router.push("/upgrade")}
                >
                  Upgrade
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      </section>

      {!loading && total > 0 && <ApplicationPipeline apps={apps} />}

      {/* Activity (main) + secondary rail */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {/* Two-up: Recent Applications + Recent Chats */}
          <section className="space-y-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Recent activity
          </div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">What changed most recently</h2>
        </div>
        <div className="grid items-start gap-4 grid-cols-1 2xl:grid-cols-2">
        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">
                  Recent applications
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  Your latest 5 entries
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
                text="No applications yet. Start by adding your first job."
                cta={
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <Link href="/job-packet">
                      <Button className="bg-primary text-white hover:bg-primary/90">Start Job Packet</Button>
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

        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">
                  Recent coach chats
                </CardTitle>
                <CardDescription className="text-foreground/70">
                  Last few messages across modes
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
                text="No chats yet. Ask the coach for quick practice or resume help."
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
                        {MODE_LABELS[m.mode]} • {m.role === "user" ? "You" : "Coach"}
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
        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-foreground/70">
              Other ways to move through the product when you need a different route.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <Link href="/job-packet" className="block">
                <ActionCard title="Run Job Packet">
                  Move from JD to tailored draft to tracked application in one guided flow.
                </ActionCard>
              </Link>
              <Link href="/resume" className="block">
                <ActionCard title="Tailor Resume">
                  Customize your resume for a specific role.
                </ActionCard>
              </Link>
              <Link href="/scanner" className="block">
                <ActionCard title="Scan Job Description">
                  Extract keywords and gaps from a job posting.
                </ActionCard>
              </Link>
              <Link href="/interview" className="block">
                <ActionCard title="Practice Interview">
                  Run a scored mock interview tailored to your target role.
                </ActionCard>
              </Link>
              <Link href="/tracker" className="block">
                <ActionCard title="Track Applications">
                  Keep tabs on every application you send.
                </ActionCard>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>
        </div>
      </div>

      {/* Pro: Performance Insights */}
      {plan === "pro" && analytics ? <PerformanceInsights analytics={analytics} /> : null}
    </div>
  );
}
