import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { getCurrentUser } from "@/lib/auth/session";
import { buildScanAnalytics } from "@/lib/analytics/scan-analytics";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import InsightsClient from "./InsightsClient";

export const metadata: Metadata = createPageMetadata({
  title: "Insights",
  description: "How your job search is going.",
  path: "/dashboard/insights",
  index: false,
});

export default async function InsightsPage() {
  const { user, error } = await getCurrentUser();
  if (error || !user?.id) redirect("/login?next=/dashboard/insights");

  const analytics = await buildScanAnalytics(user.id);

  return (
    <PageContainer>
      <PageHeader title="Insights" description="How your applications are doing, and what your scans keep asking for." />
      <InsightsClient analytics={analytics} />
    </PageContainer>
  );
}
