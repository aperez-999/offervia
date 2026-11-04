"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Check, Crown, FileText, Mic, ScanSearch, ShieldCheck, CreditCard } from "lucide-react";
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
    label: "Coach messages",
    free: `${PLAN_LIMITS.free.coach_messages_per_month} / month`,
    pro: `${PLAN_LIMITS.pro.coach_messages_per_month} / month`,
  },
  {
    label: "Job scans",
    free: `${PLAN_LIMITS.free.job_scans_per_month} / month`,
    pro: `${PLAN_LIMITS.pro.job_scans_per_month} / month`,
  },
  {
    label: "Cover letters",
    free: `${PLAN_LIMITS.free.cover_letters_per_month} / month`,
    pro: `${PLAN_LIMITS.pro.cover_letters_per_month} / month`,
  },
  { label: "Mock interviews", free: `${PLAN_LIMITS.free.interview_sessions_per_month} / month`, pro: "Unlimited" },
];

const PRO_PERKS = [
  {
    icon: FileText,
    title: "More tailored resumes",
    body: `Tailor up to ${PLAN_LIMITS.pro.resume_tailor_per_month} resumes a month instead of ${PLAN_LIMITS.free.resume_tailor_per_month}.`,
  },
  {
    icon: ScanSearch,
    title: "More job scans",
    body: `Scan up to ${PLAN_LIMITS.pro.job_scans_per_month} job descriptions a month instead of ${PLAN_LIMITS.free.job_scans_per_month}.`,
  },
  {
    icon: Mic,
    title: "Unlimited mock interviews",
    body: `Practice as often as you want, with up to ${PLAN_LIMITS.pro.coach_messages_per_month.toLocaleString()} coach messages a month.`,
  },
  {
    icon: BarChart3,
    title: "Dashboard insights",
    body: "See your response, interview, and offer rates, plus your scan scores over time.",
  },
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
        title: data?.message || "Couldn't start checkout. Try again.",
        variant: "destructive",
      });
      setLoading(false);
    } catch {
      toast({
        title: "Couldn't start checkout. Try again.",
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
        title: data?.message || "Couldn't open the billing portal. Try again.",
        variant: "destructive",
      });
      setBillingLoading(false);
    } catch {
      toast({
        title: "Couldn't open the billing portal. Try again.",
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
          {isPro ? "Your plan" : "Get higher limits with Pro"}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-foreground/75 sm:text-base">
          Pro is $10 a month. It raises your monthly limits for scans, resume tailoring, cover letters, and coaching.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="grid items-stretch gap-6 lg:grid-cols-2">
        {/* Free */}
        <Card className="flex flex-col rounded-2xl border border-border bg-card shadow-sm">
          <CardContent className="flex flex-1 flex-col p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Free</h2>
              <span className="rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-xs font-medium text-foreground/70">
                $0
              </span>
            </div>
            <div className="mt-4 flex items-baseline gap-1">
              <span className="text-4xl font-semibold tracking-tight text-foreground">$0</span>
              <span className="text-sm text-foreground/60">/month</span>
            </div>
            <p className="mt-2 text-sm text-foreground/70">Every tool, with lower monthly limits.</p>
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
        <Card className="relative flex flex-col overflow-hidden rounded-2xl border border-primary/40 bg-card shadow-sm ring-2 ring-primary/25">
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
            <p className="mt-2 text-sm text-foreground/75">For when you&apos;re applying to a lot of jobs.</p>
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
                {isPro ? "Update your card or cancel in the billing portal." : "Checkout runs through Stripe. Cancel anytime."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Perks */}
      <section>
        <h2 className="mb-4 text-xs font-semibold text-foreground/60">
          What you get with Pro
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
                className="flex gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
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
          <ShieldCheck className="h-4 w-4 text-success" /> Payments handled by Stripe
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Check className="h-4 w-4 text-success" /> Cancel anytime
        </span>
      </section>
    </motion.div>
  );
}
