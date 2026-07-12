"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, ShieldCheck, Zap, CreditCard } from "lucide-react";
import { PLAN_LIMITS } from "@/lib/plans";
import { useToast } from "@/hooks/use-toast";

type PlanType = "free" | "pro";

const COMPARISON = [
  {
    label: "Resume tailors",
    free: `${PLAN_LIMITS.free.resume_tailor_per_month} / month`,
    pro: `${PLAN_LIMITS.pro.resume_tailor_per_month} / month`,
  },
  {
    label: "AI coach messages",
    free: `${PLAN_LIMITS.free.coach_messages_per_month} / month`,
    pro: `${PLAN_LIMITS.pro.coach_messages_per_month} / month`,
  },
  {
    label: "Job scans",
    free: `${PLAN_LIMITS.free.job_scans_per_month} / month`,
    pro: `${PLAN_LIMITS.pro.job_scans_per_month} / month`,
  },
  { label: "Interview sessions", free: `${PLAN_LIMITS.free.interview_sessions_per_month} / month`, pro: "Unlimited" },
];

const PRO_PERKS = [
  { icon: Zap, title: "Faster iteration", body: "Generate more resume versions without slowing your workflow." },
  { icon: Sparkles, title: "Better targeting", body: "Scan more JDs and close keyword gaps before you apply." },
  { icon: Crown, title: "Interview readiness", body: "More coaching reps and unlimited interview sessions." },
  { icon: ShieldCheck, title: "Stay in control", body: "Same workflow across more roles. Cancel anytime." },
];

export default function UpgradeClient({ plan }: { plan: PlanType }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);
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
      toast({
        title: data?.message || "Couldn't start checkout. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    } catch {
      toast({
        title: "Couldn't start checkout. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  }

  async function openBilling() {
    if (billingLoading) return;
    setBillingLoading(true);
    try {
      const res = await fetch("/api/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json().catch(() => ({}));
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      toast({
        title: data?.message || "Billing portal unavailable. Try again.",
        variant: "destructive",
      });
      setBillingLoading(false);
    } catch {
      toast({
        title: "Billing portal unavailable. Try again.",
        variant: "destructive",
      });
      setBillingLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mx-auto max-w-5xl space-y-10"
    >
      {/* Hero */}
      <section className="text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Crown className="h-3.5 w-3.5" />
          {isPro ? "You're on Pro" : "Upgrade to Pro"}
        </div>
        <h1 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Keep your job search moving without hitting the brakes.
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-foreground/75 sm:text-base">
          Pro raises your monthly limits so you can keep scanning, tailoring, and coaching when the search gets busy.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="grid items-stretch gap-6 lg:grid-cols-2">
        {/* Free */}
        <Card className="flex flex-col rounded-2xl border border-border bg-card shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardContent className="flex flex-1 flex-col p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Free</h2>
              <span className="rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-xs font-medium text-foreground/70">
                Current starter
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight text-foreground">$0</span>
              <span className="text-sm text-foreground/60">/month</span>
            </div>
            <p className="mt-2 text-sm text-foreground/70">Everything you need to get started.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {COMPARISON.map((f) => (
                <li key={f.label} className="flex items-center justify-between gap-3 border-b border-border/60 pb-2.5 last:border-0">
                  <span className="text-foreground/80">{f.label}</span>
                  <span className="font-medium text-foreground">{f.free}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6">
              <Button
                disabled
                variant="outline"
                className="w-full cursor-default border-border text-foreground/70"
              >
                {isPro ? "Included" : "Your current plan"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Pro */}
        <Card className="relative flex flex-col overflow-hidden rounded-2xl border border-primary/40 bg-card shadow-xl shadow-primary/10 ring-2 ring-primary/25">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/20 blur-3xl"
          />
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            Most popular
          </span>
          <CardContent className="relative flex flex-1 flex-col p-6 sm:p-8">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/30">
                <Crown className="h-5 w-5" />
              </span>
              <h2 className="text-lg font-semibold text-foreground">Pro</h2>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight text-foreground">$10</span>
              <span className="text-sm text-foreground/60">/month</span>
            </div>
            <p className="mt-2 text-sm text-foreground/75">For heavier search weeks and broad applications.</p>
            <ul className="mt-6 space-y-3 text-sm">
              {COMPARISON.map((f) => (
                <li key={f.label} className="flex items-center justify-between gap-3 border-b border-primary/10 pb-2.5 last:border-0">
                  <span className="flex items-center gap-2 text-foreground/90">
                    <Check className="h-4 w-4 shrink-0 text-primary" />
                    {f.label}
                  </span>
                  <span className="font-semibold text-foreground">{f.pro}</span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-6">
              {isPro ? (
                <Button
                  onClick={openBilling}
                  disabled={billingLoading}
                  className="w-full bg-primary-button text-white shadow-sm hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  {billingLoading ? "Opening…" : "Manage billing"}
                </Button>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-full cursor-pointer bg-primary-button text-white shadow-sm hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
                >
                  {loading ? "Redirecting…" : "Upgrade to Pro"}
                </Button>
              )}
              <p className="mt-2 text-center text-xs text-foreground/55">
                {isPro ? "Update payment method or cancel anytime." : "Secure checkout via Stripe · cancel anytime."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Perks */}
      <section>
        <h2 className="mb-4 text-xs font-semibold text-foreground/60">
          What Pro unlocks
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PRO_PERKS.map((p, i) => {
            const Icon = p.icon;
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1], delay: i * 0.07 }}
                className="card-hover flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
              >
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.title}</p>
                  <p className="mt-0.5 text-sm text-foreground/70">{p.body}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Trust row */}
      <section className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-foreground/60">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-success" /> Secure Stripe checkout
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-4 w-4 text-success" /> Cancel anytime
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-success" /> Instant access
        </span>
      </section>
    </motion.div>
  );
}
