"use client";

import { Lock, Rocket, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-4 sm:space-y-6 p-4 sm:p-6"
    >
      <h1 className="text-2xl font-semibold flex items-center gap-2">
        <Rocket className="h-5 w-5 text-indigo-500" /> Coming Soon
      </h1>

      <p className="text-sm text-foreground/70 max-w-2xl">
        These features are currently in development. We’ll ship them as polished upgrades — not half-finished experiments.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <Card
            key={f.title}
            className="relative rounded-2xl border border-border bg-card/60 opacity-80 cursor-not-allowed shadow-sm ring-1 ring-white/5 dark:ring-black/10"
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
        Pro roadmap is evolving — follow{" "}
        <span className="font-medium text-indigo-500">PerezDev</span> for updates.
      </div>
    </motion.div>
  );
}