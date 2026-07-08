import { redirect } from "next/navigation";
import { getPlanLimits } from "@/lib/plans";
import { getUsageSnapshot } from "@/lib/usage/read";
import { buildScanAnalytics } from "@/lib/analytics/scan-analytics";
import DashboardClient from "./DashboardClient";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { getCurrentUser, getCurrentUserSubscription } from "@/lib/auth/session";

export const metadata: Metadata = createPageMetadata({
  title: "Dashboard",
  description: "Pick up where you left off, review progress, and keep your job search organized in one calm workspace.",
  path: "/dashboard",
  index: false,
});

export default async function DashboardPage() {
  const { user, error: authError } = await getCurrentUser();

  if (authError || !user?.id) {
    redirect("/login");
  }

  const [subscription, usage] = await Promise.all([
    getCurrentUserSubscription(user.id),
    getUsageSnapshot(user.id),
  ]);
  const plan = subscription.plan;
  const limits = getPlanLimits(plan);
  const analytics = plan === "pro" ? await buildScanAnalytics(user.id) : null;

  return (
    <DashboardClient
      plan={plan}
      usage={usage}
      limits={{
        resume_tailor_per_month: limits.resume_tailor_per_month,
        coach_messages_per_month: limits.coach_messages_per_month,
        job_scans_per_month: limits.job_scans_per_month,
        interview_sessions_per_month: limits.interview_sessions_per_month,
        cover_letters_per_month: limits.cover_letters_per_month,
      }}
      analytics={analytics}
      periodEnd={subscription.currentPeriodEnd}
    />
  );
}
