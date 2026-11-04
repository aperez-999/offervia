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
    desc: "University courses in data science, business, medicine, art history, and more.",
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
    desc: "Free lessons and practice in math, science, and the humanities.",
    url: "https://www.khanacademy.org/",
    category: "Learning",
    tags: ["math", "science", "foundations"],
    free: true,
    verified: true,
  },
  {
    id: "nursing-org",
    title: "Nursing.org Study Guides",
    desc: "Resources for nursing students: NCLEX prep, scholarships, and study guides.",
    url: "https://www.nursing.org/resources/",
    category: "Learning",
    tags: ["healthcare", "nursing", "guides"],
    free: true,
  },
  {
    id: "mitocw",
    title: "MIT OpenCourseWare",
    desc: "Free course materials from MIT in engineering, science, economics, and more.",
    url: "https://ocw.mit.edu/",
    category: "Learning",
    tags: ["engineering", "science", "economics"],
    free: true,
  },
  {
    id: "artstation-learning",
    title: "ArtStation Learning",
    desc: "Video tutorials for artists and designers: animation, concept art, and 3D modeling.",
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
    desc: "Writing help for essays, resumes, and reports inside Notion.",
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
    desc: "Prep courses for the GRE, MCAT, LSAT, and GMAT.",
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
    desc: "Free grammar, clarity, and tone checker for school or work writing.",
    url: "https://www.grammarly.com/",
    category: "Tools",
    tags: ["writing", "english", "proofreading"],
    free: true,
  },
  {
    id: "figma",
    title: "Figma",
    desc: "Shared design tool for UI/UX work, diagrams, and project visuals.",
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
    desc: "Free reference manager for research papers and projects.",
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
    desc: "Automated feedback on your resume and LinkedIn profile.",
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

export default function ResourcesPanel() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [savedOnly, setSavedOnly] = useState(false);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    CATALOG.forEach((r) => r.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, []);

  const savedCount = useMemo(
    () => Object.values(saved).filter(Boolean).length,
    [saved],
  );

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
      const okSaved = !savedOnly || !!saved[r.id];
      return okCat && okText && okTags && okSaved;
    });
  }, [q, cat, activeTags, savedOnly, saved]);

  const hasFilters = cat !== "All" || activeTags.length > 0 || q.trim() !== "" || savedOnly;
  const clearFilters = () => {
    setCat("All");
    setActiveTags([]);
    setQ("");
    setSavedOnly(false);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <p className="text-xs font-medium text-primary">Learning resources</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Student resources</h1>
            <p className="mt-1 max-w-2xl text-sm text-foreground/70">
              Courses, practice tools, and career sites. Save the ones you want to come back to.
            </p>
          </div>
          <div className="flex gap-2 text-center">
            <div className="rounded-xl border border-border bg-background/60 px-4 py-2">
              <div className="text-lg font-semibold text-foreground">{CATALOG.length}</div>
              <div className="text-xs text-foreground/60">Resources</div>
            </div>
            <div className="rounded-xl border border-border bg-background/60 px-4 py-2">
              <div className="text-lg font-semibold text-success">{CATALOG.filter((r) => r.free).length}</div>
              <div className="text-xs text-foreground/60">Free</div>
            </div>
            <div className="rounded-xl border border-border bg-background/60 px-4 py-2">
              <div className="text-lg font-semibold text-foreground">{savedCount}</div>
              <div className="text-xs text-foreground/60">Saved</div>
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
                <button
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="mb-2 text-xs font-medium text-foreground/50">Category</div>
            <div className="mb-4 flex flex-col gap-1">
              {CATEGORIES.map((c) => (
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

            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-1.5 text-sm text-foreground/80 hover:bg-foreground/[0.06]">
              <input
                type="checkbox"
                checked={savedOnly}
                onChange={(e) => setSavedOnly(e.target.checked)}
                className="h-4 w-4 accent-primary"
              />
              Saved only
            </label>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 text-xs font-medium text-foreground/50">Tags</div>
            <div className="flex flex-wrap gap-2">
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
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
                      active
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border text-foreground/80 hover:bg-foreground/[0.06]"
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    {t}
                  </button>
                );
              })}
            </div>
          </section>
        </aside>

        {/* Main */}
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              placeholder="Search resources…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full sm:max-w-sm bg-background/80 text-foreground border-border"
            />
            <div className="text-xs text-foreground/60">
              Showing {filtered.length} of {CATALOG.length}
            </div>
          </div>

          <section className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
            {filtered.length === 0 ? (
              <Card className="rounded-xl border border-dashed border-border bg-card shadow-sm sm:col-span-2 2xl:col-span-3">
                <CardContent className="flex min-h-[180px] flex-col items-center justify-center text-center">
                  <p className="text-sm font-medium text-foreground">No resources match those filters.</p>
                  <Button variant="outline" size="sm" className="mt-3" onClick={clearFilters}>
                    Clear filters
                  </Button>
                </CardContent>
              </Card>
            ) : filtered.map((r) => (
              <Card
                key={r.id}
                className="rounded-xl border border-border bg-card shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-foreground">{r.title}</CardTitle>
                  <CardDescription className="text-foreground/70">
                    {r.category}
                    {r.verified && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-success">
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
                        <Badge className="border border-success/30 bg-success/10 text-success">
                          Free
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-2">
                    <Button
                      asChild
                      className="bg-primary-button text-white hover:bg-primary-button/90"
                    >
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        Open <ExternalLink className="ml-1 h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className={`border-border text-foreground hover:bg-foreground/[0.06] ${
                        saved[r.id] ? "border-primary/30" : ""
                      }`}
                      onClick={() =>
                        setSaved((s) => ({ ...s, [r.id]: !s[r.id] }))
                      }
                      aria-label={saved[r.id] ? `Remove ${r.title} from saved` : `Save ${r.title}`}
                      aria-pressed={!!saved[r.id]}
                    >
                      <Bookmark
                        className={`h-4 w-4 ${
                          saved[r.id]
                            ? "fill-primary text-primary  "
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
      </div>
    </div>
  );
}
