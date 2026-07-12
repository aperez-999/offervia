"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type PipelineApp = {
  status: "Applied" | "Interviewing" | "Offer" | "Rejected";
  applied_on: string;
};

const STAGES: {
  key: "applied" | "interviewing" | "offer";
  label: string;
  accent: string;
}[] = [
  { key: "applied", label: "Applied", accent: "var(--status-applied)" },
  { key: "interviewing", label: "Interviewing", accent: "var(--status-interviewing)" },
  { key: "offer", label: "Offer", accent: "var(--status-offer)" },
];

function startOfWeek(date: Date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7; // Monday = 0
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - day);
  return d;
}

export default function ApplicationPipeline({ apps }: { apps: PipelineApp[] }) {
  const { funnel, trend, interviewRate, offerRate } = useMemo(() => {
    const total = apps.length;
    const offers = apps.filter((a) => a.status === "Offer").length;
    // Anyone currently interviewing or with an offer has reached the interview stage.
    const reachedInterview = apps.filter(
      (a) => a.status === "Interviewing" || a.status === "Offer"
    ).length;

    const funnel = {
      applied: total,
      interviewing: reachedInterview,
      offer: offers,
    };

    // Last 8 weeks of application volume.
    const weeks: { label: string; key: string; count: number }[] = [];
    const now = startOfWeek(new Date());
    for (let i = 7; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(start.getDate() - i * 7);
      weeks.push({
        label: start.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        key: start.toISOString().slice(0, 10),
        count: 0,
      });
    }
    const byKey = new Map(weeks.map((w) => [w.key, w]));
    for (const a of apps) {
      if (!a.applied_on) continue;
      const parsed = new Date(a.applied_on);
      if (Number.isNaN(parsed.getTime())) continue;
      const wk = startOfWeek(parsed).toISOString().slice(0, 10);
      const bucket = byKey.get(wk);
      if (bucket) bucket.count += 1;
    }

    return {
      funnel,
      trend: weeks,
      interviewRate: total ? Math.round((reachedInterview / total) * 100) : 0,
      offerRate: total ? Math.round((offers / total) * 100) : 0,
    };
  }, [apps]);

  if (apps.length === 0) return null;

  const maxStage = Math.max(funnel.applied, 1);

  return (
    <section
      className="rounded-xl border border-border bg-card px-4 py-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10 sm:px-6 sm:py-5"
      aria-label="Application pipeline"
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <div className="text-xs font-semibold text-foreground/60">
            Pipeline
          </div>
          <h3 className="mt-1 text-lg font-semibold text-foreground">Your application funnel</h3>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <div className="text-xs text-foreground/60">Interview rate</div>
            <div className="text-xl font-semibold text-foreground">{interviewRate}%</div>
          </div>
          <div>
            <div className="text-xs text-foreground/60">Offer rate</div>
            <div className="text-xl font-semibold text-foreground">{offerRate}%</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        {/* Funnel bars */}
        <div className="space-y-3">
          {STAGES.map((stage) => {
            const value = funnel[stage.key];
            const pct = Math.round((value / maxStage) * 100);
            return (
              <div key={stage.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground/80">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: stage.accent }}
                    />
                    {stage.label}
                  </span>
                  <span className="font-medium text-foreground">{value}</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-foreground/[0.06]">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: stage.accent }}
                  />
                </div>
              </div>
            );
          })}
          <p className="pt-1 text-xs text-foreground/50">
            Stages are inferred from current status — applicants in &ldquo;Offer&rdquo; are counted as
            having reached the interview stage.
          </p>
        </div>

        {/* Applications over time */}
        <div>
          <p className="mb-2 text-sm text-foreground/70">Applications · last 8 weeks</p>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-foreground/10" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11 }}
                  className="text-foreground/60"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11 }}
                  className="text-foreground/60"
                  tickLine={false}
                  axisLine={false}
                  width={28}
                />
                <Tooltip
                  cursor={{ fill: "var(--brand)", fillOpacity: 0.08 }}
                  formatter={(value) => [`${value ?? 0}`, "Applications"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                    color: "var(--foreground)",
                  }}
                  labelStyle={{ color: "var(--foreground)" }}
                  itemStyle={{ color: "var(--foreground)" }}
                />
                <Bar dataKey="count" fill="var(--brand)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
