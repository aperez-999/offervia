"use client";

import { useMemo, useState } from "react";
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
  category:
    | "AI"
    | "Dev Tools"
    | "Productivity"
    | "Cloud"
    | "Design"
    | "Learning"
    | "Engineering"
    | "Collaboration"
    | "STEM Tools"
    | "Career"
    | "Coding";
  requiresEdu?: boolean;
  percentOff?: number;
  notes?: string;
};

const DEALS: Deal[] = [
  {
    id: "notion-student",
    vendor: "Notion",
    title: "Notion Education Plan",
    desc: "Personal Pro plan for students. Useful for class notes and project planning.",
    url: "https://www.notion.so/students",
    category: "Productivity",
    requiresEdu: true,
    percentOff: 100,
  },
  {
    id: "github-student-pack",
    vendor: "GitHub",
    title: "Student Developer Pack",
    desc: "Free access to popular dev tools, cloud credits, and learning resources.",
    url: "https://education.github.com/pack",
    category: "Dev Tools",
    requiresEdu: true,
  },
  {
    id: "figma-edu",
    vendor: "Figma",
    title: "Figma Education",
    desc: "Figma's Professional plan for students and educators.",
    url: "https://www.figma.com/education/",
    category: "Design",
    requiresEdu: true,
    percentOff: 100,
  },
  {
    id: "jetbrains-edu",
    vendor: "JetBrains",
    title: "IDEs for Students",
    desc: "Professional JetBrains IDEs (like IntelliJ, PyCharm, WebStorm) free for students.",
    url: "https://www.jetbrains.com/community/education/#students",
    category: "Dev Tools",
    requiresEdu: true,
  },
  {
    id: "google-cloud-student",
    vendor: "Google Cloud",
    title: "Google Cloud for Students",
    desc: "Get $50–$100 in cloud credits and access to Google Cloud training paths.",
    url: "https://cloud.google.com/edu/students",
    category: "Cloud",
    requiresEdu: true,
  },
  {
    id: "microsoft-azure-student",
    vendor: "Microsoft Azure",
    title: "Azure for Students",
    desc: "Free $100 credit and 25+ Azure services for students, no credit card required.",
    url: "https://azure.microsoft.com/en-us/free/students/",
    category: "Cloud",
    requiresEdu: true,
  },
  {
    id: "canva-edu",
    vendor: "Canva",
    title: "Canva for Education",
    desc: "Canva Pro features, free for teachers and students.",
    url: "https://www.canva.com/education/",
    category: "Design",
    requiresEdu: true,
  },
  {
    id: "wolfram-alpha",
    vendor: "Wolfram Alpha",
    title: "Wolfram Alpha Pro for Students",
    desc: "Step-by-step explanations and advanced problem-solving tools, discounted for students.",
    url: "https://www.wolframalpha.com/pro/",
    category: "STEM Tools",
    requiresEdu: false,
  },
  {
    id: "autodesk-edu",
    vendor: "Autodesk",
    title: "Autodesk Education Access",
    desc: "Free access to AutoCAD, Fusion 360, Revit, Maya, and more design tools.",
    url: "https://www.autodesk.com/education/edu-software/overview",
    category: "Engineering",
    requiresEdu: true,
  },
  {
    id: "notion-ai-trial",
    vendor: "AI Tools",
    title: "Notion AI (Free Trial)",
    desc: "Try Notion AI for summarizing and drafting inside your notes.",
    url: "https://www.notion.so/product/ai",
    category: "AI",
    requiresEdu: false,
  },
  {
    id: "replit-edu",
    vendor: "Replit",
    title: "Replit Hacker Plan for Students",
    desc: "Replit's premium plan, free through the GitHub Student Pack.",
    url: "https://replit.com/site/github-students",
    category: "Coding",
    requiresEdu: true,
  },
  {
    id: "coursera-edu",
    vendor: "Coursera",
    title: "Coursera for Students",
    desc: "Free access to online courses and certificates.",
    url: "https://www.coursera.org/career-academy/programs/learning-program-students-ig5jd",
    category: "Learning",
    requiresEdu: true,
  },
  {
    id: "slack-student",
    vendor: "Slack",
    title: "Slack for Student Teams",
    desc: "Free workspace upgrades for student groups collaborating on projects.",
    url: "https://slack.com/education",
    category: "Collaboration",
    requiresEdu: true,
  },
  {
    id: "todoist-edu",
    vendor: "Todoist",
    title: "Todoist Premium for Students",
    desc: "Free upgrade to organize assignments, projects, and personal tasks.",
    url: "https://www.todoist.com/pricing",
    category: "Productivity",
    requiresEdu: true,
  },
];

const CATS = [
  "All",
  "AI",
  "Dev Tools",
  "Productivity",
  "Cloud",
  "Design",
  "Learning",
  "Engineering",
  "Collaboration",
  "STEM Tools",
  "Career",
  "Coding",
] as const;

export default function DealsPanel() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATS)[number]>("All");
  const [eduOnly, setEduOnly] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return DEALS.filter((d) => {
      const okCat = cat === "All" || d.category === cat;
      const okText =
        !text ||
        d.vendor.toLowerCase().includes(text) ||
        d.title.toLowerCase().includes(text) ||
        d.desc.toLowerCase().includes(text);
      const okEdu = !eduOnly || !!d.requiresEdu;
      const okFree = !freeOnly || d.percentOff === 100;
      return okCat && okText && okEdu && okFree;
    });
  }, [q, cat, eduOnly, freeOnly]);

  const freeCount = useMemo(() => DEALS.filter((d) => d.percentOff === 100).length, []);
  const eduCount = useMemo(() => DEALS.filter((d) => d.requiresEdu).length, []);
  const hasFilters = cat !== "All" || q.trim() !== "" || eduOnly || freeOnly;
  const clearFilters = () => {
    setCat("All");
    setQ("");
    setEduOnly(false);
    setFreeOnly(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <p className="text-xs font-medium text-primary">Student deals</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Student discounts
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-foreground/70">
              Free plans, discounts, and cloud credits for students. Most need a school email to sign up.
            </p>
          </div>
          <div className="flex gap-2 text-center">
            <div className="rounded-xl border border-border bg-background/60 px-4 py-2">
              <div className="text-lg font-semibold text-foreground">{DEALS.length}</div>
              <div className="text-xs text-foreground/60">Perks</div>
            </div>
            <div className="rounded-xl border border-border bg-background/60 px-4 py-2">
              <div className="text-lg font-semibold text-success">{freeCount}</div>
              <div className="text-xs text-foreground/60">Free</div>
            </div>
            <div className="rounded-xl border border-border bg-background/60 px-4 py-2">
              <div className="text-lg font-semibold text-foreground">{eduCount}</div>
              <div className="text-xs text-foreground/60">.edu</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Filter rail */}
        <aside className="space-y-6 xl:sticky xl:top-24">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="font-medium text-foreground">Filters</div>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs text-primary hover:underline">
                  Clear
                </button>
              )}
            </div>

            <div className="mb-2 text-xs font-medium text-foreground/50">Category</div>
            <div className="mb-4 flex flex-col gap-1">
              {CATS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`rounded-lg px-3 py-1.5 text-left text-sm transition ${
                    cat === c
                      ? "bg-primary/10 text-primary"
                      : "text-foreground/80 hover:bg-foreground/[0.06]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="space-y-1">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/[0.06]">
                <input type="checkbox" checked={freeOnly} onChange={(e) => setFreeOnly(e.target.checked)} className="h-4 w-4 accent-primary" />
                Free (100% off)
              </label>
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/[0.06]">
                <input type="checkbox" checked={eduOnly} onChange={(e) => setEduOnly(e.target.checked)} className="h-4 w-4 accent-primary" />
                .edu eligible
              </label>
            </div>
          </section>

          <Card className="rounded-2xl border border-border bg-card shadow-sm">
            <CardContent className="flex items-start gap-3 p-4">
              <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="text-sm font-medium text-foreground">How verification works</div>
                <div className="text-sm text-foreground/70">
                  Most vendors check a .edu email or use SheerID. If you&apos;ve graduated, ask your school about alumni email. Some keep forwarding active.
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Main */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Search deals…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full sm:max-w-sm bg-background/80 text-foreground border-border"
            />
            <div className="text-xs text-foreground/60">
              Showing {filtered.length} of {DEALS.length}
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {filtered.length === 0 ? (
              <Card className="rounded-xl border border-dashed border-border bg-card shadow-sm sm:col-span-2 2xl:col-span-3">
                <CardContent className="flex min-h-[180px] flex-col items-center justify-center text-center">
                  <p className="text-sm font-medium text-foreground">No deals match those filters.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : filtered.map((d) => (
              <Card
                key={d.id}
                className="rounded-xl border border-border bg-card shadow-sm"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-foreground">{d.vendor}</CardTitle>
                    {d.requiresEdu && (
                      <Badge className="border border-success/30 bg-success/10 text-success inline-flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" />
                        .edu required
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-foreground/70">
                    {d.title}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col h-full">
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-foreground/80">{d.desc}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-2">
                    <div className="text-xs font-medium text-success">
                      {typeof d.percentOff === "number" ? `${d.percentOff}% off` : ""}
                    </div>
                    <Button
                      asChild
                      className="bg-primary-button text-white hover:bg-primary-button/90"
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
        </div>
      </div>
    </div>
  );
}
