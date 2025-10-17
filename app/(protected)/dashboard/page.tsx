"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppLayout from "@/components/layout/AppLayout";
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
import { Flame, Sparkles } from "lucide-react";

type Application = {
  id: string;
  user_id: string;
  company: string;
  position: string;
  status: "Applied" | "Interviewing" | "Offer" | "Rejected";
  applied_on: string; // ISO date
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

export default function DashboardPage() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [loading, setLoading] = useState(true);
  const [apps, setApps] = useState<Application[]>([]);
  const [recentChats, setRecentChats] = useState<MsgRow[]>([]);
  const [friendlyName, setFriendlyName] = useState<string>("there");

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

      // Load applications
      const { data: appData } = await supabase
        .from("applications")
        .select("id,user_id,company,position,status,applied_on,created_at")
        .eq("user_id", user.id);

      const normalized = (appData || []).map((a: any) => ({
        ...a,
        applied_on: a.applied_on
          ? new Date(a.applied_on).toISOString().slice(0, 10)
          : "",
      })) as Application[];

      normalized.sort((a, b) =>
        b.applied_on > a.applied_on ? 1 : b.applied_on < a.applied_on ? -1 : 0
      );
      setApps(normalized);

      // Load recent chats (last 8 messages across modes)
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

  // KPIs
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

  // Weekly goal
  const weeklyGoalTarget = 5;
  const weeklyGoalPct = Math.max(
    0,
    Math.min(100, Math.round((appsThisWeek / weeklyGoalTarget) * 100))
  );

  // Streak (consecutive days with ≥1 application)
  const streak = useMemo(() => {
    const set = new Set(
      apps
        .filter((a) => a.applied_on)
        .map((a) => a.applied_on.slice(0, 10))
    );
    let s = 0;
    const oneDay = 24 * 60 * 60 * 1000;
    let cursor = new Date();
    // normalize to local date midnight
    cursor = new Date(
      cursor.getFullYear(),
      cursor.getMonth(),
      cursor.getDate()
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

  // Next best action
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Greeting */}
        <section>
          <h1 className="text-2xl font-semibold text-foreground">
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
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi title="Applications (total)" value={total} />
          <Kpi title="Applications (this week)" value={appsThisWeek} />
          <Kpi title="Interviewing" value={interviewing} />
          <Kpi title="Offers" value={offers} />
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          {/* Weekly goal */}
          <Card className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  Weekly Goal
                </div>
                <div className="mt-1 text-sm text-foreground/80">
                  {appsThisWeek}/{weeklyGoalTarget} applications
                </div>
              </div>
              <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <Progress
              value={weeklyGoalPct}
              className="mt-3 h-2"
            />
          </Card>

          {/* Streak */}
          <Card className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
                  Streak
                </div>
                <div className="mt-1 text-2xl font-semibold text-foreground">
                  {streak} day{streak === 1 ? "" : "s"}
                </div>
                <p className="mt-1 text-xs text-foreground/60">
                  Keep up the momentum with one small action today.
                </p>
              </div>
              <Flame className="h-6 w-6 text-orange-500" />
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
        <section className="grid gap-4 lg:grid-cols-2">
          {/* Recent Applications */}
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
                    className="border-border text-foreground hover:bg-foreground/[0.06]"
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
                      <div className="flex items-center gap-3">
                        <div className="hidden text-xs text-foreground/70 sm:block">
                          {a.applied_on}
                        </div>
                        <StatusBadge s={a.status} />
                        <Button
                          asChild
                          variant="outline"
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

          {/* Recent Coach Chats */}
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
                    className="border-border text-foreground hover:bg-foreground/[0.06]"
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
                      <Button>Start chatting</Button>
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
            <CardContent className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-foreground">
                  {nextAction.title}
                </div>
                <div className="text-xs text-foreground/70">{nextAction.desc}</div>
              </div>
              <Link href={nextAction.href}>
                <Button className="bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black">
                  {nextAction.cta}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppLayout>
  );
}

/* ---------- helpers ---------- */

function Kpi({ title, value }: { title: string; value: number }) {
  return (
    <Card className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
      <div className="text-xs font-medium uppercase tracking-wide text-foreground/60">
        {title}
      </div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
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