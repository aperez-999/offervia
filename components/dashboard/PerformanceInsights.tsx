"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ScanAnalytics } from "@/lib/analytics/scan-analytics";

export default function PerformanceInsights({
  analytics,
}: {
  analytics: ScanAnalytics;
}) {
  return (
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
              <span className="text-success">+{analytics.improvement}%</span>
            ) : analytics.improvement < 0 ? (
              <span className="text-destructive">{analytics.improvement}%</span>
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
                  formatter={(value: number | undefined) => (value != null ? `${value}%` : "")}
                  labelFormatter={(label) => `Scan #${label}`}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                    color: "var(--foreground)",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  itemStyle={{ color: "var(--foreground)" }}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--brand)"
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
  );
}
