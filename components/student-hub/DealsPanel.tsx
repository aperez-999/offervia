"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowSquareOut, GraduationCap, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { CATS, DEALS } from "@/content/student-hub/deals";



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

  const hasFilters = cat !== "All" || q.trim() !== "" || eduOnly || freeOnly;
  const clearFilters = () => {
    setCat("All");
    setQ("");
    setEduOnly(false);
    setFreeOnly(false);
  };

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-foreground/75">Free plans and discounts for students. Most need a school email to sign up.</p>

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
                      className="bg-primary-button text-primary-button-foreground hover:bg-primary-button/90"
                    >
                      <a href={d.url} target="_blank" rel="noopener noreferrer">
                        View <ArrowSquareOut className="ml-1 h-4 w-4" />
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
