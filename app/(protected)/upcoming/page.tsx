"use client";

import { Lock, Rocket, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function UpcomingPage() {
  const features = [
    {
      title: "AI Resume Analyzer Pro",
      desc: "Unlock deeper job-specific resume scoring with recruiter-style insights.",
    },
    {
      title: "Auto-Apply Automation",
      desc: "Apply to multiple job portals instantly with your tailored resume.",
    },
    {
      title: "Portfolio Generator",
      desc: "Generate a personal portfolio site synced with your Offervia profile data.",
    },
    {
      title: "Interview Simulator",
      desc: "Practice live AI-driven mock interviews with feedback in real time.",
    },
    {
      title: "Career Path Insights",
      desc: "Track your growth metrics and receive data-driven job recommendations.",
    },
    {
      title: "Scholarship Finder (Students Pro)",
      desc: "Personalized scholarship and grant recommendations by major.",
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Rocket className="h-5 w-5 text-indigo-500" /> Coming Soon
      </h1>

      <p className="text-sm text-foreground/70 max-w-2xl">
        These features are currently in development and will be available post-beta.
        Stay tuned for the Pro release — Offervia is just getting started.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card
            key={f.title}
            className="relative border-border bg-muted/40 opacity-70 cursor-not-allowed"
          >
            <Lock className="absolute right-3 top-3 h-4 w-4 text-foreground/50" />
            <CardHeader>
              <CardTitle className="text-foreground/80">{f.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground/60">{f.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 text-center text-xs text-foreground/50">
        <Sparkles className="inline h-3 w-3 mr-1" />
        Pro features launch Q1 2026 — follow{" "}
        <span className="font-medium text-indigo-500">PerezDev</span> for updates.
      </div>
    </div>
  );
}