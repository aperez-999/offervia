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
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import type { UsageSnapshot } from "@/lib/usage-read";

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

type PlanType = "free" | "pro";

export type ScanAnalytics = {
  totalScans: number;
  averageScore: number;
  bestScore: number;
  improvement: number | null;
  scanHistory: { score: number; created_at: string }[];
};

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

  function dismissUpgradeBanner() {
    router.replace("/dashboard");
  }

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

  const weeklyGoalTarget = 5;
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

  const nextAction = useMemo(() => {
    if (appsThisWeek === 0) {
      return {
        title: "Log your first application this week",
        desc:
          "A small start beats no start. Track one application to keep momentum.",
        href: "/tracker",
        cta: "Add Job",
      };
    }
    if (recentChats.length === 0) {
      return {
        title: "Ask the coach a quick question",
        desc:
          "Practice a mock interview or tighten a resume bullet in minutes.",
        href: "/coach",
        cta: "Open Coach",
      };
    }
    return {
      title: "Scan a job description",
      desc: "Find keywords and gaps to sharpen your next application.",
      href: "/scanner",
      cta: "Scan JD",
    };
  }, [appsThisWeek, recentChats.length]);

  const usagePct = (used: number, limit: number) =>
    limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  const usageState = (pct: number): "low" | "warn" | "high" => {
    if (pct >= 100) return "high";
    if (pct >= 70) return "warn";
    return "low";
  };

  const nearingLimit = useMemo(() => {
    const p1 = usagePct(usage.resumeTailor, limits.resume_tailor_per_month);
    const p2 = usagePct(usage.coachMessages, limits.coach_messages_per_month);
    const p3 = usagePct(usage.jobScans, limits.job_scans_per_month);
    return (
      (p1 >= 80 && p1 < 100) ||
      (p2 >= 80 && p2 < 100) ||
      (p3 >= 80 && p3 < 100)
    );
  }, [usage, limits]);

  return (
    <div className="space-y-4 sm:space-y-6">
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

      {/* Soft upgrade nudge when Free user is nearing limit (80–99%) */}
      {plan === "free" && nearingLimit && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
          <div>
            <p className="font-medium text-foreground">
              You&apos;re close to your monthly limit.
            </p>
            <p className="mt-0.5 text-foreground/80">
              Upgrade to Pro to keep optimizing without interruption.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 cursor-pointer border-amber-500/40 bg-amber-500/10 text-amber-800 hover:bg-amber-500/20 dark:text-amber-200 dark:border-amber-500/30 dark:hover:bg-amber-500/20"
            onClick={() => router.push("/upgrade")}
          >
            Upgrade
          </Button>
        </div>
      )}

      {/* Monthly usage strip */}
      <section className="rounded-xl border border-border bg-card/60 px-4 py-3 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
          This month
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(() => {
            const pct = usagePct(
              usage.resumeTailor,
              limits.resume_tailor_per_month
            );
            const state = usageState(pct);
            const textClass =
              state === "high"
                ? "text-red-400"
                : state === "warn"
                ? "text-amber-300"
                : "text-foreground/90";
            const barClass =
              state === "high"
                ? "bg-red-500"
                : state === "warn"
                ? "bg-amber-500"
                : "bg-indigo-600 dark:bg-indigo-400";
            const extraLabel = state === "high" ? " • Limit reached" : "";
            return (
              <div>
                <div className={`text-sm ${textClass}`}>
                  Resume Tailors: {usage.resumeTailor} / {limits.resume_tailor_per_month}
                  {extraLabel}
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-foreground/10">
                  <div
                    className={`h-full rounded-full transition-all ${barClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {(() => {
            const pct = usagePct(
              usage.coachMessages,
              limits.coach_messages_per_month
            );
            const state = usageState(pct);
            const textClass =
              state === "high"
                ? "text-red-400"
                : state === "warn"
                ? "text-amber-300"
                : "text-foreground/90";
            const barClass =
              state === "high"
                ? "bg-red-500"
                : state === "warn"
                ? "bg-amber-500"
                : "bg-indigo-600 dark:bg-indigo-400";
            const extraLabel = state === "high" ? " • Limit reached" : "";
            return (
              <div>
                <div className={`text-sm ${textClass}`}>
                  AI Coach: {usage.coachMessages} / {limits.coach_messages_per_month}
                  {extraLabel}
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-foreground/10">
                  <div
                    className={`h-full rounded-full transition-all ${barClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          {(() => {
            const pct = usagePct(
              usage.jobScans,
              limits.job_scans_per_month
            );
            const state = usageState(pct);
            const textClass =
              state === "high"
                ? "text-red-400"
                : state === "warn"
                ? "text-amber-300"
                : "text-foreground/90";
            const barClass =
              state === "high"
                ? "bg-red-500"
                : state === "warn"
                ? "bg-amber-500"
                : "bg-indigo-600 dark:bg-indigo-400";
            const extraLabel = state === "high" ? " • Limit reached" : "";
            return (
              <div>
                <div className={`text-sm ${textClass}`}>
                  Job Scans: {usage.jobScans} / {limits.job_scans_per_month}
                  {extraLabel}
                </div>
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-foreground/10">
                  <div
                    className={`h-full rounded-full transition-all ${barClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </section>

      {/* Greeting */}
      <section>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Welcome back,{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-indigo-400 bg-clip-text text-transparent dark:from-indigo-400 dark:to-indigo-300">
            {friendlyName}
          </span>{" "}
        </h1>
        <p className="mt-1 text-sm text-foreground/70">
          Ready to make progress toward your next offer?
        </p>
      </section>

      {/* KPIs + Goal/Streak */}
      <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Kpi title="Applications (total)" value={total} />
        <Kpi title="Applications (this week)" value={appsThisWeek} />
        <Kpi title="Interviewing" value={interviewing} />
        <Kpi title="Offers" value={offers} />
      </section>

      {/* Pro: Performance Insights */}
      {plan === "pro" && analytics && (
        <section
          className="mt-6 rounded-xl border border-border bg-card/60 px-6 py-5"
          aria-label="Performance Insights"
        >
          <h3 className="text-lg font-semibold text-foreground">Performance Insights</h3>
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
              <p className="mt-4 mb-2 text-sm text-muted-foreground">Match Score Trend</p>
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

      <section className="grid gap-3 grid-cols-1 sm:grid-cols-2">
        <Card className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                Weekly Goal
              </div>
              <div className="mt-1 text-sm text-foreground/80">
                {appsThisWeek}/{weeklyGoalTarget} applications
              </div>
            </div>
            <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
          </div>
          <Progress value={weeklyGoalPct} className="mt-3 h-2" />
        </Card>

        <Card className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                Streak
              </div>
              <div className="mt-1 text-xl sm:text-2xl font-semibold text-foreground">
                {streak} day{streak === 1 ? "" : "s"}
              </div>
              <p className="mt-1 text-xs text-foreground/60">
                Keep up the momentum with one small action today.
              </p>
            </div>
            <Flame className="h-6 w-6 text-orange-500 flex-shrink-0" />
          </div>
        </Card>
      </section>

      {/* Quick actions */}
      <section>
        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">Quick Actions</CardTitle>
            <CardDescription className="text-foreground/70">
              Jump right in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Two-up: Recent Applications + Recent Chats */}
      <section className="grid gap-4 grid-cols-1 lg:grid-cols-2">
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
                  <Link href="/tracker">
                    <Button>+ Add Job</Button>
                  </Link>
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
                    <Button className="cursor-pointer">Start chatting</Button>
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
      </section>

      {/* Next best action */}
      <section>
        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-foreground">Next best action</CardTitle>
            <CardDescription className="text-foreground/70">
              A tiny push that keeps momentum.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium text-foreground">
                {nextAction.title}
              </div>
              <div className="text-xs text-foreground/70">{nextAction.desc}</div>
            </div>
            <Link href={nextAction.href}>
              <Button className="w-full sm:w-auto cursor-pointer bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black">
                {nextAction.cta}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <Card className="rounded-2xl border border-border bg-card/60 p-3 sm:p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
      <div className="text-xs font-medium uppercase tracking-wide text-foreground/60 truncate">
        {title}
      </div>
      <div className="mt-2 text-xl sm:text-2xl font-semibold text-foreground">{value}</div>
    </Card>
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
