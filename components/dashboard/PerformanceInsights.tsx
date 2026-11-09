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
      className="rounded-xl border border-border bg-card px-6 py-5"
      aria-label="Scan insights"
    >
      <div className="mb-4">
        <div className="text-xs font-semibold text-foreground/60">
          Pro
        </div>
        <h3 className="mt-1 text-lg font-semibold text-foreground">Scan insights</h3>
        <p className="mt-1 text-sm text-foreground/70">
          How well your resume matches the jobs you scan, over time.
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div>
          <div className="text-xs font-medium text-foreground/60">
            Average match score
          </div>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {analytics.averageScore}%
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-foreground/60">
            Best score
          </div>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {analytics.bestScore}%
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-foreground/60">
            Total scans
          </div>
          <div className="mt-1 text-2xl font-semibold text-foreground">
            {analytics.totalScans}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-foreground/60">
            Score change
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
                  formatter={(value) => (typeof value === "number" ? `${value}%` : "")}
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

      {analytics.skillGaps.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-sm font-medium text-foreground">
            Recurring skill gaps
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Skills your scans flag as missing most often. Add these to your resume
            if you have them.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {analytics.skillGaps.map((gap) => (
              <li
                key={gap.skill}
                className="inline-flex items-center gap-1.5 rounded-full border border-warning/30 bg-warning/10 px-3 py-1 text-sm text-warning"
              >
                <span className="font-medium">{gap.skill}</span>
                <span className="rounded-full bg-warning/20 px-1.5 text-xs font-semibold tabular-nums">
                  {gap.count}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
