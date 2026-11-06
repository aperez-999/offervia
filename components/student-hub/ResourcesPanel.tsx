"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowSquareOut, BookmarkSimple, CheckCircle, Tag } from "@phosphor-icons/react/dist/ssr";
import { CATALOG, CATEGORIES } from "@/content/student-hub/resources";



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
      <p className="max-w-2xl text-sm text-foreground/75">Courses, practice, and career sites. Save the ones you want to come back to.</p>

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
                        <CheckCircle className="h-3 w-3" />
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
                      className="bg-primary-button text-primary-button-foreground hover:bg-primary-button/90"
                    >
                      <a href={r.url} target="_blank" rel="noopener noreferrer">
                        Open <ArrowSquareOut className="ml-1 h-4 w-4" />
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
                      <BookmarkSimple
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
