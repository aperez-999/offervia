import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";
import { getPlanLimits } from "@/lib/plans";
import { getUsageSnapshot } from "@/lib/usage-read";
import { getServiceSupabase } from "@/lib/supabase/service";
import DashboardClient, { type ScanAnalytics } from "./DashboardClient";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set() {},
        remove() {},
      },
    }
  );

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    redirect("/login");
  }

  const subscription = await getUserSubscription(user.id);
  const plan = subscription.plan;
  const limits = getPlanLimits(plan);
  const usage = await getUsageSnapshot(user.id);

  let analytics: ScanAnalytics | null = null;
  if (plan === "pro") {
    const serviceSupabase = getServiceSupabase();
    const { data: scans } = await serviceSupabase
      .from("job_scans")
      .select("match_score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const list = scans ?? [];
    const totalScans = list.length;
    const averageScore =
      totalScans === 0
        ? 0
        : Math.round(
            list.reduce((sum, s) => sum + (Number(s.match_score) || 0), 0) / totalScans
          );
    const bestScore =
      totalScans === 0
        ? 0
        : Math.max(...list.map((s) => Number(s.match_score) || 0));

    let improvement: number | null = null;
    if (totalScans >= 6) {
      const firstFive = list.slice(0, 5);
      const lastFive = list.slice(-5);
      const firstFiveAvg =
        firstFive.reduce((sum, s) => sum + (Number(s.match_score) || 0), 0) / firstFive.length;
      const lastFiveAvg =
        lastFive.reduce((sum, s) => sum + (Number(s.match_score) || 0), 0) / lastFive.length;
      improvement = Math.round((lastFiveAvg - firstFiveAvg) * 10) / 10;
    }

    const scanHistory = list.map((s) => ({
      score: Number(s.match_score) || 0,
      created_at: typeof s.created_at === "string" ? s.created_at : new Date(s.created_at).toISOString(),
    }));

    analytics = {
      totalScans,
      averageScore,
      bestScore,
      improvement,
      scanHistory,
    } satisfies ScanAnalytics;
  }

  return (
    <DashboardClient
      plan={plan}
      usage={usage}
      limits={{
        resume_tailor_per_month: limits.resume_tailor_per_month,
        coach_messages_per_month: limits.coach_messages_per_month,
        job_scans_per_month: limits.job_scans_per_month,
      }}
      analytics={analytics}
    />
  );
}
