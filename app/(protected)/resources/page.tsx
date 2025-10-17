"use client";

import { useMemo, useState } from "react";
import AppLayout from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ExternalLink, Tag, CheckCircle2, Bookmark } from "lucide-react";

// ---- Sample catalog (swap with DB later)
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
  {
    id: "cs-roadmap",
    title: "CS Self-Study Roadmap",
    desc: "A pragmatic path covering fundamentals, algorithms, systems, and projects.",
    url: "https://roadmap.sh/computer-science",
    category: "Learning",
    tags: ["roadmap", "foundations"],
    free: true,
    verified: true,
  },
  {
    id: "neetcode",
    title: "NeetCode Patterns",
    desc: "Interview patterns + problem lists for LeetCode-style practice.",
    url: "https://neetcode.io/",
    category: "Practice",
    tags: ["dsa", "interview"],
    free: true,
  },
  {
    id: "excalidraw",
    title: "Excalidraw",
    desc: "Freehand diagrams—perfect for systems interview sketches.",
    url: "https://excalidraw.com/",
    category: "Tools",
    tags: ["diagram", "systems"],
    free: true,
    verified: true,
  },
  {
    id: "system-design-primer",
    title: "System Design Primer",
    desc: "Open-source guide to system design concepts and tradeoffs.",
    url: "https://github.com/donnemartin/system-design-primer",
    category: "Learning",
    tags: ["systems", "scalability"],
    free: true,
  },
  {
    id: "cs50",
    title: "Harvard CS50",
    desc: "Legendary introductory course with lectures, labs, and problem sets.",
    url: "https://cs50.harvard.edu/",
    category: "Learning",
    tags: ["foundations"],
    free: true,
    verified: true,
  },
  {
    id: "readme-so",
    title: "readme.so",
    desc: "Simple editor to craft a great README for your project portfolio.",
    url: "https://readme.so/",
    category: "Tools",
    tags: ["portfolio", "docs"],
    free: true,
  },
  {
    id: "blind-templates",
    title: "Behavioral Story Templates",
    desc: "STAR templates to structure behavioral answers quickly.",
    url: "https://www.interviewcake.com/behavioral-interviews",
    category: "Career",
    tags: ["behavioral", "interview"],
    free: true,
  },
];

const CATEGORIES = ["All", "Learning", "Practice", "Tools", "Career"] as const;

export default function ResourcesPage() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<(typeof CATEGORIES)[number]>("All");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [saved, setSaved] = useState<Record<string, boolean>>({}); // TODO: persist in Supabase later

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
    <AppLayout>
      <div className="space-y-6">
        <section>
          <h1 className="text-2xl font-semibold text-foreground">Resources</h1>
          <p className="mt-1 text-sm text-foreground/70">
            Curated links and tools to help you level up—kept clean and focused.
          </p>
        </section>

        {/* Controls */}
        <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
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
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search resources…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full sm:w-72 bg-background/80 text-foreground border-border"
            />
          </div>
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
              <CardContent className="space-y-3">
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
                <div className="flex items-center justify-between pt-1">
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
    </AppLayout>
  );
}