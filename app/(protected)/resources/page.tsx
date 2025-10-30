"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Tag, CheckCircle2, Bookmark } from "lucide-react";

type Resource = {
  id: string;
  title: string;
  desc: string;
  url: string;
  category: "Learning" | "Practice" | "Tools" | "Career";
  tags: string[];
  free?: boolean;
  verified?: boolean;
};

const CATALOG: Resource[] = [
  // === LEARNING ===
  {
    id: "coursera",
    title: "Coursera",
    desc: "University-level courses in everything from data science to art history, business, and medicine.",
    url: "https://www.coursera.org/",
    category: "Learning",
    tags: ["online courses", "certificates", "university"],
    free: false,
    verified: true,
  },
  {
    id: "edx",
    title: "edX",
    desc: "Free and paid courses from top institutions like MIT, Harvard, and Stanford.",
    url: "https://www.edx.org/",
    category: "Learning",
    tags: ["online learning", "certificates"],
    free: true,
    verified: true,
  },
  {
    id: "khan-academy",
    title: "Khan Academy",
    desc: "Free, world-class education for anyone, covering math, science, and humanities.",
    url: "https://www.khanacademy.org/",
    category: "Learning",
    tags: ["math", "science", "foundations"],
    free: true,
    verified: true,
  },
  {
    id: "nursing-org",
    title: "Nursing.org Study Guides",
    desc: "Comprehensive resources for nursing students — NCLEX prep, scholarships, and guides.",
    url: "https://www.nursing.org/resources/",
    category: "Learning",
    tags: ["healthcare", "nursing", "guides"],
    free: true,
  },
  {
    id: "mitocw",
    title: "MIT OpenCourseWare",
    desc: "Free access to MIT's entire curriculum — engineering, science, economics, and more.",
    url: "https://ocw.mit.edu/",
    category: "Learning",
    tags: ["engineering", "science", "economics"],
    free: true,
  },
  {
    id: "artstation-learning",
    title: "ArtStation Learning",
    desc: "Creative video tutorials for artists and designers—animation, concept art, and 3D modeling.",
    url: "https://www.artstation.com/learning",
    category: "Learning",
    tags: ["art", "design", "animation"],
    free: true,
  },

  // === PRACTICE ===
  {
    id: "quizlet",
    title: "Quizlet",
    desc: "Flashcards, quizzes, and practice tests for every subject from biology to business.",
    url: "https://quizlet.com/",
    category: "Practice",
    tags: ["study", "flashcards", "memory"],
    free: true,
  },
  {
    id: "notion-ai-writing",
    title: "Notion AI Writing Assistant",
    desc: "AI-powered writing help for essays, resumes, and reports—perfect for all majors.",
    url: "https://www.notion.so/product/ai",
    category: "Tools",
    tags: ["ai", "writing", "productivity"],
    free: false,
    verified: true,
  },
  {
    id: "big-interview",
    title: "Big Interview",
    desc: "Practice behavioral and technical interviews with AI feedback and templates.",
    url: "https://biginterview.com/",
    category: "Career",
    tags: ["interview", "ai", "career"],
    free: false,
  },
  {
    id: "magoosh",
    title: "Magoosh Test Prep",
    desc: "GRE, MCAT, LSAT, and GMAT prep courses trusted by students worldwide.",
    url: "https://magoosh.com/",
    category: "Practice",
    tags: ["test prep", "graduate school"],
    free: false,
  },

  // === TOOLS ===
  {
    id: "canva",
    title: "Canva",
    desc: "Create resumes, presentations, and posters with free templates.",
    url: "https://www.canva.com/",
    category: "Tools",
    tags: ["design", "resume", "presentation"],
    free: true,
  },
  {
    id: "grammarly",
    title: "Grammarly",
    desc: "Free grammar, clarity, and tone checker—great for academic or business writing.",
    url: "https://www.grammarly.com/",
    category: "Tools",
    tags: ["writing", "english", "proofreading"],
    free: true,
  },
  {
    id: "figma",
    title: "Figma",
    desc: "Collaborative design tool for UI/UX, architecture diagrams, or project visuals.",
    url: "https://www.figma.com/",
    category: "Tools",
    tags: ["design", "ux", "prototyping"],
    free: true,
  },
  {
    id: "lucidchart",
    title: "Lucidchart for Students",
    desc: "Create flowcharts, mind maps, and project visuals for free with an EDU email.",
    url: "https://www.lucidchart.com/pages/education",
    category: "Tools",
    tags: ["visuals", "organization", "education"],
    free: true,
  },
  {
    id: "zotero",
    title: "Zotero",
    desc: "Free reference manager for research papers and projects—essential for any major.",
    url: "https://www.zotero.org/",
    category: "Tools",
    tags: ["citations", "research", "academic"],
    free: true,
  },

  // === CAREER ===
  {
    id: "handshake",
    title: "Handshake",
    desc: "Career networking and internship platform connecting students with employers.",
    url: "https://joinhandshake.com/",
    category: "Career",
    tags: ["internships", "jobs", "networking"],
    free: true,
    verified: true,
  },
  {
    id: "linkedin-learning",
    title: "LinkedIn Learning",
    desc: "Professional skill-building courses across tech, business, and creative industries.",
    url: "https://www.linkedin.com/learning/",
    category: "Career",
    tags: ["skills", "certificates", "networking"],
    free: false,
  },
  {
    id: "resumeworded",
    title: "Resume Worded",
    desc: "AI resume and LinkedIn feedback to improve your job chances instantly.",
    url: "https://resumeworded.com/",
    category: "Career",
    tags: ["resume", "linkedin", "ai"],
    free: false,
    verified: true,
  },
  {
    id: "goinglobal",
    title: "GoinGlobal",
    desc: "Career and internship resources for students seeking international opportunities.",
    url: "https://www.goinglobal.com/",
    category: "Career",
    tags: ["global", "internships", "international"],
    free: false,
  },
  {
    id: "careerone",
    title: "CareerOneStop",
    desc: "U.S. Department of Labor site for job search tools, salaries, and career paths.",
    url: "https://www.careeronestop.org/",
    category: "Career",
    tags: ["salary", "career paths", "government"],
    free: true,
    verified: true,
  },
];

const CATEGORIES = ["All", "Learning", "Practice", "Tools", "Career"] as const;

export default function ResourcesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const allTags = useMemo(() => {
    const set = new Set<string>();
    CATALOG.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return CATALOG.filter((r) => {
      const okCat = cat === "All" || r.category === cat;
      const okText =
        !text ||
        r.title.toLowerCase().includes(text) ||
        r.desc.toLowerCase().includes(text) ||
        r.tags.some((t) => t.toLowerCase().includes(text));
      const okTags =
        activeTags.length === 0 || activeTags.every((t) => r.tags.includes(t));
      return okCat && okText && okTags;
    });
  }, [q, cat, activeTags]);

  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      <section>
        <h1 className="text-2xl font-semibold text-foreground">Student Resources</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Curated academic, career, and creative resources to help every student grow—no matter their field.
          <br></br>
          <br></br>
          This page gets updated frequently - More coming soon.
        </p>
      </section>

      {/* Controls */}
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
          {CATEGORIES.map((c) => (
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
          placeholder="Search resources…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full sm:w-72 bg-background/80 text-foreground border-border"
        />
      </section>

      {/* Tag filter */}
      <section className="flex flex-wrap gap-2">
        {allTags.map((t) => {
          const active = activeTags.includes(t);
          return (
            <button
              key={t}
              onClick={() =>
                setActiveTags((prev) =>
                  active ? prev.filter((x) => x !== t) : [...prev, t]
                )
              }
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs ${
                active
                  ? "border-indigo-500/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300"
                  : "border-border text-foreground/80 hover:bg-foreground/[0.06]"
              }`}
            >
              <Tag className="h-3 w-3" />
              {t}
            </button>
          );
        })}
      </section>

      {/* Grid */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <Card
            key={r.id}
            className="rounded-xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-foreground">{r.title}</CardTitle>
              <CardDescription className="text-foreground/70">
                {r.category}
                {r.verified && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-emerald-500">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col h-full">
              <div className="flex-1 space-y-3">
                <p className="text-sm text-foreground/80">{r.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {r.tags.map((t) => (
                    <Badge
                      key={t}
                      className="border border-foreground/10 bg-foreground/[0.06] text-foreground/70"
                    >
                      {t}
                    </Badge>
                  ))}
                  {r.free && (
                    <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                      Free
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pt-2">
                <Button
                  asChild
                  className="bg-indigo-600 text-white hover:bg-indigo-500"
                >
                  <a href={r.url} target="_blank" rel="noopener noreferrer">
                    Open <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className={`border-border text-foreground hover:bg-foreground/[0.06] ${
                    saved[r.id] ? "border-indigo-500/40" : ""
                  }`}
                  onClick={() =>
                    setSaved((s) => ({ ...s, [r.id]: !s[r.id] }))
                  }
                >
                  <Bookmark
                    className={`h-4 w-4 ${
                      saved[r.id]
                        ? "fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400"
                        : ""
                    }`}
                  />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}