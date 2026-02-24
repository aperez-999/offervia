"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/plans";

type PlanType = "free" | "pro";

const FREE_FEATURES = [
  { label: "Resume tailors", value: `${PLAN_LIMITS.free.resume_tailor_per_month} / month` },
  { label: "AI coach messages", value: `${PLAN_LIMITS.free.coach_messages_per_month} / month` },
  { label: "Job scans", value: `${PLAN_LIMITS.free.job_scans_per_month} / month` },
  { label: "Interview sessions", value: "Limited" },
];

const PRO_FEATURES = [
  { label: "Resume tailors", value: `${PLAN_LIMITS.pro.resume_tailor_per_month} / month` },
  { label: "AI coach messages", value: `${PLAN_LIMITS.pro.coach_messages_per_month} / month` },
  { label: "Job scans", value: `${PLAN_LIMITS.pro.job_scans_per_month} / month` },
  { label: "Interview sessions", value: "Unlimited" },
  { label: "Priority processing", value: "Coming soon", muted: true },
  { label: "Advanced performance analytics", value: "Coming soon", muted: true },
];

export default function UpgradeClient({ plan }: { plan: PlanType }) {
  const [loading, setLoading] = useState(false);
  const isPro = plan === "pro";

  async function handleUpgrade() {
    if (isPro || loading) return;
    setLoading(true);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Stop guessing. Start optimizing your job hunt.
        </h1>
        <p className="mt-3 text-sm text-foreground/80 sm:text-base">
          Offervia Pro turns your job search into a performance system — more data,
          more iterations, more control.
        </p>
      </section>

      {/* Why Pro? */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground/70">
          Why Pro?
        </h2>
        <ul className="space-y-2 text-sm text-foreground/90">
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span><strong className="text-foreground">Faster iteration</strong> — more resume versions per month, less waiting.</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span><strong className="text-foreground">Better targeting</strong> — scan more JDs, close keyword gaps before you apply.</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span><strong className="text-foreground">Stronger interview readiness</strong> — more coaching reps when it matters.</span>
          </li>
          <li className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span><strong className="text-foreground">More control</strong> — turn your job search into a measurable system.</span>
          </li>
        </ul>
      </section>

      {/* Performance mindset callout */}
      <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">
          Free is for exploring. Pro is for optimizing.
        </p>
        <p className="mt-1.5 text-foreground/75">
          When iteration speed increases, your odds improve — because you test more, refine faster, and waste less time.
        </p>
      </div>

      {/* Plan comparison */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Free
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <div
                key={f.label}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span className="text-foreground/80">{f.label}</span>
                <span className="font-medium text-foreground">{f.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-emerald-500/30 bg-card/60 shadow-sm ring-1 ring-emerald-500/10 dark:ring-emerald-500/10">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-foreground">
                Pro
              </CardTitle>
              <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                $10/month
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <div
                key={f.label}
                className={`flex items-center justify-between gap-2 text-sm ${f.muted ? "text-muted-foreground" : ""}`}
              >
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  {f.label}
                </span>
                <span className={f.muted ? "text-muted-foreground" : "font-medium text-foreground"}>
                  {f.value}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      {/* In practice */}
      <section>
        <p className="text-sm text-foreground/80">
          <span className="font-medium text-foreground">In practice:</span> If you apply to 20 roles per month, Pro lets you tailor and scan nearly every one — instead of guessing with a few.
        </p>
      </section>

      {/* CTA */}
      <section className="flex flex-col items-center gap-3">
        {isPro ? (
          <p className="text-sm font-medium text-foreground/80">
            You&apos;re already on Pro.
          </p>
        ) : (
          <>
            <Button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full max-w-sm cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black sm:w-auto sm:px-8"
            >
              {loading ? "Redirecting…" : "Upgrade to Pro — $10/month"}
            </Button>
            <p className="text-xs text-muted-foreground">
              Cancel anytime. Stay in control.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
