"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { captureClientException } from "@/lib/monitoring/sentry";
import type { DashboardApp } from "@/lib/dashboard/overview";

type Prefs = {
  weekly_goal?: number | null;
  onboarding_dismissed?: boolean | null;
  onboarding_completed?: Record<string, boolean> | null;
};

function capitalizeFirst(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : value;
}

/** Applications, name, and preferences for Home and Insights. */
export function useDashboardData() {
  const supabase = useMemo(() => getBrowserSupabase(), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [apps, setApps] = useState<DashboardApp[]>([]);
  const [firstName, setFirstName] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(5);
  const [hasChats, setHasChats] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState<Record<string, boolean>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const meta = user.user_metadata || {};
      const name = String(meta.full_name || meta.name || user.email?.split("@")[0] || "");
      setFirstName(capitalizeFirst(name.trim().split(/\s+/)[0] ?? ""));

      const [prefsRes, appsRes, chatsRes] = await Promise.all([
        supabase
          .from("user_prefs")
          .select("weekly_goal,onboarding_dismissed,onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("applications")
          .select("id,company,position,status,applied_on,follow_up_date")
          .eq("user_id", user.id),
        supabase.from("messages").select("id", { head: true, count: "exact" }).eq("user_id", user.id),
      ]);

      // Applications are the core of these screens: fail loudly rather than
      // showing an empty state that isn't true.
      if (appsRes.error) throw appsRes.error;

      const prefs = prefsRes.data as Prefs | null;
      if (prefs) {
        if (typeof prefs.weekly_goal === "number" && Number.isFinite(prefs.weekly_goal)) {
          setWeeklyGoal(Math.max(0, Math.min(50, Math.round(prefs.weekly_goal))));
        }
        if (typeof prefs.onboarding_dismissed === "boolean") setOnboardingDismissed(prefs.onboarding_dismissed);
        if (prefs.onboarding_completed && typeof prefs.onboarding_completed === "object") {
          setOnboardingCompleted(prefs.onboarding_completed);
        }
      }

      const normalized = ((appsRes.data ?? []) as Array<Record<string, unknown>>)
        .map((entry) => ({
          ...entry,
          applied_on:
            typeof entry.applied_on === "string" && entry.applied_on
              ? new Date(entry.applied_on).toISOString().slice(0, 10)
              : "",
        }))
        .sort((a, b) => String(b.applied_on).localeCompare(String(a.applied_on))) as DashboardApp[];

      setApps(normalized);
      setHasChats((chatsRes.count ?? 0) > 0);
    } catch (err) {
      captureClientException(err, { scope: "dashboard.load" });
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const saveOnboarding = useCallback(
    async (next: { dismissed?: boolean; completed?: Record<string, boolean> }) => {
      const dismissed = next.dismissed ?? onboardingDismissed;
      const completed = next.completed ?? onboardingCompleted;
      setOnboardingDismissed(dismissed);
      setOnboardingCompleted(completed);
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user?.id) return;
        await supabase
          .from("user_prefs")
          .upsert(
            { user_id: user.id, onboarding_dismissed: dismissed, onboarding_completed: completed },
            { onConflict: "user_id" }
          );
      } catch {
        // Keep the local state; it's only a checklist.
      }
    },
    [supabase, onboardingDismissed, onboardingCompleted]
  );

  return {
    loading,
    error,
    reload: load,
    apps,
    firstName,
    weeklyGoal,
    hasChats,
    onboardingDismissed,
    onboardingCompleted,
    saveOnboarding,
  };
}
