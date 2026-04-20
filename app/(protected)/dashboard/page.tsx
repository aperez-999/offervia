import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";
import { getPlanLimits } from "@/lib/plans";
import { getUsageSnapshot } from "@/lib/usage/read";
import { buildScanAnalytics } from "@/lib/analytics/scan-analytics";
import DashboardClient from "./DashboardClient";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
  });

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

  const analytics = plan === "pro" ? await buildScanAnalytics(user.id) : null;

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
