"use client";

import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GraduationCap, ExternalLink, ShieldCheck } from "lucide-react";

type Deal = {
  id: string;
  vendor: string;
  title: string;
  desc: string;
  url: string;
  category: "AI" | "Dev Tools" | "Productivity" | "Cloud";
  requiresEdu?: boolean;
  percentOff?: number;
  notes?: string;
};

const DEALS: Deal[] = [
  {
    id: "notion-student",
    vendor: "Notion",
    title: "Notion Education Plan",
    desc: "Personal Pro for students—great for class notes and project planning.",
    url: "https://www.notion.so/students",
    category: "Productivity",
    requiresEdu: true,
    percentOff: 100,
  },
  {
    id: "github-student-pack",
    vendor: "GitHub",
    title: "Student Developer Pack",
    desc: "Free access to popular dev tools, credits, and learning resources.",
    url: "https://education.github.com/pack",
    category: "Dev Tools",
    requiresEdu: true,
  },
  {
    id: "figma-edu",
    vendor: "Figma",
    title: "Figma Education",
    desc: "Professional plan for students & educators—design, whiteboarding.",
    url: "https://www.figma.com/education/",
    category: "Productivity",
    requiresEdu: true,
    percentOff: 100,
  },
  {
    id: "jetbrains-edu",
    vendor: "JetBrains",
    title: "IDEs for Students",
    desc: "Free professional IDE licenses while you’re a student.",
    url: "https://www.jetbrains.com/community/education/",
    category: "Dev Tools",
    requiresEdu: true,
  },
  {
    id: "openai-edu-tips",
    vendor: "AI Tools",
    title: "Popular EDU-friendly AI tool picks",
    desc: "A handy list of AI tools many campuses allow—with tips to use responsibly.",
    url: "https://github.com/",
    category: "AI",
  },
  {
    id: "aws-educate",
    vendor: "AWS",
    title: "AWS Educate",
    desc: "Free cloud learning resources and promo credits for students.",
    url: "https://aws.amazon.com/education/awseducate/",
    category: "Cloud",
    requiresEdu: true,
  },
];

const CATS = ["All", "AI", "Dev Tools", "Productivity", "Cloud"] as const;

export default function StudentsPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return DEALS.filter((d) => {
      const okCat = cat === "All" || d.category === cat;
      const okText =
        !text ||
        d.vendor.toLowerCase().includes(text) ||
        d.title.toLowerCase().includes(text) ||
        d.desc.toLowerCase().includes(text);
      return okCat && okText;
    });
  }, [q, cat]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold text-foreground">
            Student Exclusives
          </h1>
          <p className="mt-1 text-sm text-foreground/70">
            Verified discounts and perks for students. Look for the{" "}
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              <span>“.edu required”</span>
            </span>{" "}
            badge where applicable.
          </p>
        </section>

        {/* Controls */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`rounded-full px-3 py-1 text-sm border transition ${
                  cat === c
                    ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                    : "border-border hover:bg-foreground/[0.06] text-foreground/80"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <Input
            placeholder="Search deals…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full sm:w-72 bg-background/80 text-foreground border-border"
          />
        </section>

        {/* Grid */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <Card
              key={d.id}
              className="rounded-xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-foreground">{d.vendor}</CardTitle>
                  {d.requiresEdu && (
                    <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      .edu required
                    </Badge>
                  )}
                </div>
                <CardDescription className="text-foreground/70">
                  {d.title}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-foreground/80">{d.desc}</p>
                <div className="flex items-center justify-between">
                  <div className="text-xs text-foreground/60">
                    {typeof d.percentOff === "number" ? `${d.percentOff}% off` : ""}
                  </div>
                  <Button
                    asChild
                    className="bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    <a href={d.url} target="_blank" rel="noopener noreferrer">
                      View <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </section>

        {/* Tip box */}
        <Card className="rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <CardContent className="flex items-start gap-3 p-4">
            <GraduationCap className="mt-0.5 h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <div>
              <div className="text-sm font-medium text-foreground">
                Pro tip
              </div>
              <div className="text-sm text-foreground/70">
                Many vendors verify via a .edu email or SheerID. If you’ve graduated,
                check alumni options—some schools keep email forwarding active.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}