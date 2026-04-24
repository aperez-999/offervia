"use client";

import { useEffect, useMemo, useState } from "react";
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
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import type { UsageSnapshot } from "@/lib/usage/read";
import {
  readJobPacketDraft,
  type JobPacketDraft,
} from "@/lib/job-packet";
import {
  getDashboardNextAction,
  getDashboardUsageItems,
} from "@/lib/dashboard/overview";

type PlanLimits = {
  resume_tailor_per_month: number;
  coach_messages_per_month: number;
  job_scans_per_month: number;
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
  onboarding_dismissed?: boolean | null;
  onboarding_completed?: Record<string, boolean> | null;
};

const MODE_LABELS: Record<MsgRow["mode"], string> = {
  interview: "Interview Coach",
  resume: "Resume Feedback",
  cover_letter: "Cover Letter Help",
  career: "Career Advice",
};

function StatusBadge({ s }: { s: Application["status"] }) {
  if (s === "Interviewing") {
    return (
      <Badge className="border border-indigo-500/20 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-300">
        {s}
      </Badge>
    );
  }
  if (s === "Offer") {
    return (
      <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
        {s}
      </Badge>
    );
  }
  if (s === "Rejected") {
    return <Badge variant="destructive">{s}</Badge>;
  }
  return (
    <Badge className="border border-foreground/10 bg-foreground/[0.06] text-foreground/80 hover:bg-foreground/[0.08]">
      {s}
    </Badge>
  );
}

import type { ScanAnalytics } from "@/lib/analytics/scan-analytics";

type PlanType = "free" | "pro";

export type { ScanAnalytics };

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

      // preferences
      const { data: prefs } = await supabase
        .from("user_prefs")
        .select("weekly_goal,email_digest")
        .eq("user_id", user.id)
        .maybeSingle();
      if (prefs) {
        if (typeof prefs.weekly_goal === "number" && Number.isFinite(prefs.weekly_goal)) {
          setWeeklyGoalTarget(Math.max(0, Math.min(50, Math.round(prefs.weekly_goal))));
        }
        if (typeof prefs.email_digest === "boolean") {
          setEmailDigestEnabled(prefs.email_digest);
        }
      }

      // onboarding (persisted in user_prefs)
      const { data: ob } = await supabase
        .from("user_prefs")
        .select("onboarding_dismissed,onboarding_completed")
        .eq("user_id", user.id)
        .maybeSingle();
      if (ob) {
        const typed = ob as unknown as OnboardingPrefs;
        if (typeof typed.onboarding_dismissed === "boolean") {
          setOnboardingDismissed(typed.onboarding_dismissed);
        }
        const completed = typed.onboarding_completed;
        if (completed && typeof completed === "object") {
          setOnboardingCompleted(completed as Record<string, boolean>);
        }
      }

      const { data: appData } = await supabase
        .from("applications")
        .select("id,user_id,company,position,status,applied_on,created_at")
        .eq("user_id", user.id);

      const normalized = (appData || []).map((a: Record<string, unknown>) => ({
        ...a,
        applied_on: a.applied_on && typeof a.applied_on === "string"
          ? new Date(a.applied_on).toISOString().slice(0, 10)
          : "",
      })) as Application[];

      normalized.sort((a, b) =>
        b.applied_on > a.applied_on ? 1 : b.applied_on < a.applied_on ? -1 : 0
      );
      setApps(normalized);

      const { data: msgData } = await supabase
        .from("messages")
        .select("id,user_id,mode,role,content,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(8);

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
        },
        limits,
      }),
    [limits, usage.coachMessages, usage.jobScans, usage.resumeTailor]
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-4 sm:space-y-6"
    >
      {/* Upgrade success / cancel banner */}
      {upgrade === "success" && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-800 dark:text-emerald-200 dark:border-emerald-500/20 dark:bg-emerald-500/10">
          <p className="text-sm font-medium">
            🎉 Welcome to Pro! Your limits have been unlocked.
          </p>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 shrink-0 rounded-full p-0 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 dark:hover:bg-emerald-500/20"
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
        <Card className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-card via-card/95 to-indigo-500/5 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <Badge className="border border-indigo-500/20 bg-indigo-500/10 text-indigo-700 hover:bg-indigo-500/10 dark:text-indigo-300">
                  Continue your search
                </Badge>
                <h1 className="mt-3 text-2xl font-semibold text-foreground sm:text-3xl">
                  Welcome back,{" "}
                  <span className="bg-gradient-to-r from-indigo-500 to-indigo-400 bg-clip-text text-transparent dark:from-indigo-400 dark:to-indigo-300">
                    {friendlyName}
                  </span>
                </h1>
                <p className="mt-2 text-sm text-foreground/75 sm:text-base">
                  One clear next step beats a crowded dashboard. Keep the workflow moving with the action that matters most right now.
                </p>
                <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4 shadow-sm">
                  <div className="text-sm font-medium text-foreground">{nextAction.title}</div>
                  <div className="mt-1 text-sm text-foreground/70">{nextAction.desc}</div>
                </div>
              </div>

              <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[220px]">
                <Link href={nextAction.href}>
                  <Button className="w-full cursor-pointer bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black">
                    {nextAction.cta}
                  </Button>
                </Link>
                <p className="text-xs text-foreground/60">
                  Quick actions and recent activity are just below if you need a different path.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* KPIs + Goal/Streak */}
      <section className="space-y-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Progress
          </div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">Keep the search on track</h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <Card className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  Weekly Goal
                </div>
                <div className="mt-1 text-sm text-foreground/80">
                  {appsThisWeek}/{weeklyGoalTarget} applications
                </div>
                <div className="mt-1 text-xs text-foreground/60">
                  {emailDigestEnabled ? (
                    <span>Weekly digest is on.</span>
                  ) : (
                    <span>
                      Weekly digest is off.{" "}
                      <Link href="/settings" className="underline text-indigo-600 dark:text-indigo-300">
                        Enable it in settings
                      </Link>
                      .
                    </span>
                  )}
                </div>
              </div>
              <Sparkles className="h-5 w-5 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
            </div>
            <Progress value={weeklyGoalPct} className="mt-3 h-2" />
          </Card>

          <Card className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <div className="flex items-center justify-between">
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
              <Flame className="h-6 w-6 flex-shrink-0 text-orange-500" />
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
                <Badge className="border border-amber-500/20 bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300">
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
                          ? "font-medium text-red-500"
                          : item.state === "warn"
                          ? "font-medium text-amber-500"
                          : "font-medium text-foreground"
                      }
                    >
                      {item.used} / {item.limit}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-foreground/10">
                    <div
                      className={
                        "h-full rounded-full transition-all " +
                        (item.state === "high"
                          ? "bg-red-500"
                          : item.state === "warn"
                          ? "bg-amber-500"
                          : "bg-indigo-600 dark:bg-indigo-400")
                      }
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {nearingLimit && plan === "free" ? (
              <div className="mt-4 flex flex-col gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-foreground/80">
                  You&apos;re getting close to a monthly limit. Upgrade if you want to keep the workflow moving without interruption.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-500/30 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-200"
                  onClick={() => router.push("/upgrade")}
                >
                  Upgrade
                </Button>
              </div>
            ) : null}
          </Card>
        </div>
      </section>

      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Kpi title="Applications (total)" value={total} tone="slate" />
        <Kpi title="Applications (this week)" value={appsThisWeek} tone="indigo" />
        <Kpi title="Interviewing" value={interviewing} tone="blue" />
        <Kpi title="Offers" value={offers} tone="emerald" />
      </section>

      {/* Onboarding */}
      {!onboardingDismissed && onboardingProgress.done < onboardingProgress.total && (
        <section className="rounded-xl border border-border bg-card/60 px-4 py-3 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                Getting started
              </div>
              <div className="mt-1 text-sm text-foreground/80">
                {onboardingProgress.done}/{onboardingProgress.total} completed
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 shrink-0 rounded-full p-0 hover:bg-foreground/[0.06]"
              onClick={() => persistOnboarding({ dismissed: true })}
              aria-label="Dismiss onboarding"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Progress value={onboardingProgress.pct} className="mt-3 h-2" />
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {onboardingItems.map((it) => (
              <li
                key={it.key}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm text-foreground">
                    {it.done ? "✓ " : ""}
                    {it.label}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!it.done ? (
                    <Button asChild size="sm" variant="outline" className="border-border text-foreground hover:bg-foreground/[0.06]">
                      <Link href={it.href}>Go</Link>
                    </Button>
                  ) : (
                    <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-300">
                      Done
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Two-up: Recent Applications + Recent Chats */}
      <section className="space-y-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Recent activity
          </div>
          <h2 className="mt-1 text-lg font-semibold text-foreground">What changed most recently</h2>
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
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
                      <Button className="bg-indigo-600 text-white hover:bg-indigo-500">Start Job Packet</Button>
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
                      <StatusBadge s={a.status} />
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
                        className="text-indigo-600 hover:bg-indigo-500/10 dark:text-indigo-300"
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
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              <Link href="/tracker" className="block">
                <ActionCard title="Track Applications">
                  Keep tabs on every application you send.
                </ActionCard>
              </Link>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Pro: Performance Insights */}
      {plan === "pro" && analytics && (
        <section
          className="rounded-xl border border-border bg-card/60 px-6 py-5"
          aria-label="Performance Insights"
        >
          <div className="mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Pro insights
            </div>
            <h3 className="mt-1 text-lg font-semibold text-foreground">Performance insights</h3>
            <p className="mt-1 text-sm text-foreground/70">
              A deeper view of scan quality and progress over time, kept below the main workflow so it stays secondary.
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                Average Match Score
              </div>
              <div className="mt-1 text-2xl font-semibold text-foreground">
                {analytics.averageScore}%
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                Best Score
              </div>
              <div className="mt-1 text-2xl font-semibold text-foreground">
                {analytics.bestScore}%
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                Total Scans
              </div>
              <div className="mt-1 text-2xl font-semibold text-foreground">
                {analytics.totalScans}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                Improvement
              </div>
              <div className="mt-1 text-2xl font-semibold">
                {analytics.improvement === null ? (
                  <span className="text-muted-foreground">Not enough data</span>
                ) : analytics.improvement > 0 ? (
                  <span className="text-green-400">+{analytics.improvement}%</span>
                ) : analytics.improvement < 0 ? (
                  <span className="text-red-400">{analytics.improvement}%</span>
                ) : (
                  <span className="text-muted-foreground">0%</span>
                )}
              </div>
            </div>
          </div>

          {analytics.scanHistory?.length >= 2 && (
            <>
              <p className="mb-2 mt-4 text-sm text-muted-foreground">Match score trend</p>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart
                    data={analytics.scanHistory.map((s, index) => ({
                      index: index + 1,
                      score: s.score,
                      date: new Date(s.created_at).toLocaleDateString(),
                    }))}
                    margin={{ top: 8, right: 8, left: 0, bottom: 8 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" className="stroke-foreground/10" />
                    <XAxis
                      dataKey="index"
                      tick={{ fontSize: 12 }}
                      className="text-foreground/60"
                    />
                    <YAxis
                      domain={[0, 100]}
                      tick={{ fontSize: 12 }}
                      className="text-foreground/60"
                    />
                    <Tooltip
                      formatter={(value: number | undefined) =>
                        value != null ? `${value}%` : ""
                      }
                      labelFormatter={(label) => `Scan #${label}`}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid var(--border)",
                        backgroundColor: "hsl(var(--card))",
                      }}
                      labelStyle={{ color: "hsl(var(--foreground))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </section>
      )}
    </motion.div>
  );
}

function Kpi({
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
    <motion.div whileHover={{ y: -2 }} transition={{ type: "spring", stiffness: 320, damping: 26 }}>
      <Card className="rounded-2xl border border-border bg-card/60 p-3 sm:p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs font-medium uppercase tracking-wide text-foreground/60 truncate">
            {title}
          </div>
          <div className={`h-2.5 w-2.5 rounded-full ${toneClass}`} aria-hidden />
        </div>
        <div className="mt-2 text-xl sm:text-2xl font-semibold text-foreground tabular-nums">
          {value}
        </div>
      </Card>
    </motion.div>
  );
}

function ActionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full rounded-xl border border-border bg-background/60 p-4 shadow-sm transition-all hover:shadow-md">
      <div className="text-sm font-medium text-foreground">{title}</div>
      <div className="mt-1 text-xs text-foreground/70">{children}</div>
    </Card>
  );
}

function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <ul className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <li key={i} className="h-10 rounded-md bg-foreground/[0.06]" />
      ))}
    </ul>
  );
}

function EmptyState({ text, cta }: { text: string; cta?: React.ReactNode }) {
  return (
    <div className="py-10 text-center">
      <p className="mb-3 text-sm text-foreground/70">{text}</p>
      {cta}
    </div>
  );
}

function capitalizeFirst(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
