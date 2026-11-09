import { redirect } from "next/navigation";
import { getUsageSnapshot } from "@/lib/usage/read";
import { buildScanAnalytics } from "@/lib/analytics/scan-analytics";
import DashboardClient from "./DashboardClient";
import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = createPageMetadata({
  title: "Dashboard",
  description: "See your applications, weekly goal, usage, and next step.",
  path: "/dashboard",
  index: false,
});

export default async function DashboardPage() {
  const { user, error: authError } = await getCurrentUser();

  if (authError || !user?.id) {
    redirect("/login");
  }

  const [usage, analytics] = await Promise.all([
    getUsageSnapshot(user.id),
    buildScanAnalytics(user.id),
  ]);

  return <DashboardClient usage={usage} analytics={analytics} />;
}
