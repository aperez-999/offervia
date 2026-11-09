"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import ErrorView from "@/components/ErrorView";
import { useDashboardData } from "@/components/dashboard/useDashboardData";
import { applicationRates } from "@/lib/dashboard/overview";
import type { ScanAnalytics } from "@/lib/analytics/scan-analytics";

const ApplicationPipeline = dynamic(() => import("@/components/dashboard/ApplicationPipeline"), { ssr: false });
const PerformanceInsights = dynamic(() => import("@/components/dashboard/PerformanceInsights"), { ssr: false });

const RATES = [
  { key: "responseRate", label: "Heard back", hint: "Got any reply, including a no" },
  { key: "interviewRate", label: "Interviewing", hint: "Now in the interview stage" },
  { key: "offerRate", label: "Offers", hint: "Turned into an offer" },
] as const;

export default function InsightsClient({ analytics }: { analytics: ScanAnalytics | null }) {
  const { apps, loading, error, reload } = useDashboardData();
  const rates = useMemo(() => applicationRates(apps), [apps]);

  if (error && !loading) {
    return <ErrorView title="Couldn't load your applications" description="Check your connection and try again." onRetry={reload} />;
  }
  if (loading) return <Skeleton className="h-64 w-full rounded-2xl" />;

  if (apps.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-6">
        <p className="font-medium text-foreground">Nothing to show yet.</p>
        <p className="mt-1 text-sm text-foreground/75">
          Once you&apos;ve added a few applications, this page shows how many heard back, how many reached
          interviews, and which skills come up again and again in the jobs you scan.
        </p>
        <Button asChild className="mt-4">
          <Link href="/job-packet">Start a new application</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="rates-heading" className="space-y-3">
        <h2 id="rates-heading" className="text-base font-semibold text-foreground">
          Out of {apps.length} {apps.length === 1 ? "application" : "applications"}
        </h2>
        <dl className="grid gap-4 sm:grid-cols-3">
          {RATES.map((r) => (
            <div key={r.key} className="rounded-2xl border border-border p-4">
              <dt className="text-sm text-muted-foreground">{r.label}</dt>
              <dd className="mt-1 font-display text-3xl font-semibold tabular-nums text-foreground">{rates[r.key]}%</dd>
              <dd className="mt-1 text-xs text-muted-foreground">{r.hint}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ApplicationPipeline apps={apps} />

      {analytics ? <PerformanceInsights analytics={analytics} /> : null}
    </div>
  );
}
