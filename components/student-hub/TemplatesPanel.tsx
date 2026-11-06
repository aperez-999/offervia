"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check as CheckIcon, Copy as CopyIcon, MagnifyingGlass as SearchIcon } from "@phosphor-icons/react/dist/ssr";
import TemplatePreview from "@/components/shared/TemplatePreview";
import BookmarkButton from "@/components/shared/BookmarkButton";
import { useToast } from "@/hooks/use-toast";
import { TEMPLATES, renderTemplate, type TemplateCategory, type TemplateItem } from "@/content/student-hub/templates";


/** --------------------
 * UI state
 * -------------------- */
const VARS_KEY = "offervia:templateVars_v1";
const SAVES_KEY = "offervia:saves:templates";
const TABS: Array<"All" | "Saved" | TemplateCategory> = [
  "All",
  "Saved",
  "Outreach",
  "Follow-up",
  "Thank you",
  "Referral",
  "Negotiation",
  "Ghosting",
  "Recruiter",
];

/** Render a template with variables */
export default function TemplatesPanel() {
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  // quick-fill vars (persisted locally)
  const [vars, setVars] = useState({
    name: "",
    role: "",
    company: "",
    contact: "",
    portfolio: "",
  });
  useEffect(() => {
    try {
      const raw = localStorage.getItem(VARS_KEY);
      if (raw) setVars(JSON.parse(raw));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(VARS_KEY, JSON.stringify(vars));
  }, [vars]);

  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("All");
  const [q, setQ] = useState("");

  // Saved template keys (localStorage, instant updates)
  const [savedIds, setSavedIds] = useState<Set<string>>(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem(SAVES_KEY) || "[]"));
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== SAVES_KEY) return;
      try {
        setSavedIds(new Set(JSON.parse(e.newValue || "[]")));
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleSavedToggle = (id: string, next: boolean) => {
    setSavedIds((prev) => {
      const s = new Set(prev);
      if (next) s.add(id);
      else s.delete(id);
      return s;
    });
  };

  const handleCopy = async (t: TemplateItem) => {
    try {
      await navigator.clipboard.writeText(renderTemplate(t.body, vars));
      setCopiedKey(t.key);
      window.setTimeout(() => setCopiedKey((k) => (k === t.key ? null : k)), 1500);
      toast({ variant: "success", title: "Template copied", description: "Your quick-fill details are filled in." });
    } catch {
      toast({ title: "Couldn’t copy", description: "Your browser blocked clipboard access. Open the preview and copy the text by hand.", variant: "destructive" });
    }
  };

  // computed
  const list = useMemo(() => {
    const matchTab = (t: TemplateItem) => {
      if (activeTab === "All") return true;
      if (activeTab === "Saved") return savedIds.has(t.key);
      return t.category === activeTab;
    };
    const matchSearch = (t: TemplateItem) => {
      if (!q.trim()) return true;
      const hay = `${t.title} ${t.category} ${t.tags.join(" ")}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    };
    return TEMPLATES.filter((t) => matchTab(t) && matchSearch(t));
  }, [activeTab, q, savedIds]);

  // preview dialog
  const [openKey, setOpenKey] = useState<string | null>(null);
  const active = useMemo(
    () => TEMPLATES.find((t) => t.key === openKey) || null,
    [openKey]
  );
  const rendered = active ? renderTemplate(active.body, vars) : "";

  // Gmail compose URL (SR-only anchor for a11y)
  const gmailHref = active
    ? `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
        active.title
      )}&body=${encodeURIComponent(rendered)}`
    : "#";

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-sm text-foreground/75">Emails for outreach, follow-ups, referrals, and offers. Fill in your details once, then edit each one before you send it.</p>

      <div className="grid items-start gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        {/* Rail: quick fill + categories */}
        <aside className="space-y-6 xl:sticky xl:top-24">
          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-1 font-medium text-foreground">Quick fill</div>
            <p className="mb-3 text-xs text-foreground/60">
              Saved in this browser and filled into every template.
            </p>
            <div className="grid gap-2">
              <Input
                placeholder="Your name"
                value={vars.name}
                onChange={(e) => setVars({ ...vars, name: e.target.value })}
                className="border-border bg-background/80 text-foreground"
              />
              <Input
                placeholder="Role (e.g., Software Engineer)"
                value={vars.role}
                onChange={(e) => setVars({ ...vars, role: e.target.value })}
                className="border-border bg-background/80 text-foreground"
              />
              <Input
                placeholder="Company"
                value={vars.company}
                onChange={(e) => setVars({ ...vars, company: e.target.value })}
                className="border-border bg-background/80 text-foreground"
              />
              <Input
                placeholder="Recruiter or contact name"
                value={vars.contact}
                onChange={(e) => setVars({ ...vars, contact: e.target.value })}
                className="border-border bg-background/80 text-foreground"
              />
              <Input
                placeholder="Portfolio or LinkedIn URL"
                value={vars.portfolio}
                onChange={(e) => setVars({ ...vars, portfolio: e.target.value })}
                className="border-border bg-background/80 text-foreground"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-3 font-medium text-foreground">Categories</div>
            <div className="flex flex-wrap gap-2">
              {TABS.map((t) => (
                <Button
                  key={t}
                  size="sm"
                  variant={activeTab === t ? "default" : "outline"}
                  onClick={() => setActiveTab(t)}
                  className={
                    activeTab === t
                      ? "bg-primary-button text-primary-button-foreground hover:bg-primary-button/90"
                      : "border-border text-foreground hover:bg-foreground/[0.06]"
                  }
                >
                  {t}
                </Button>
              ))}
            </div>
          </section>
        </aside>

        {/* Main: search + grid */}
        <div className="space-y-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, category, or tag…"
              className="border-border bg-background/80 pl-9 text-foreground"
            />
          </div>

          <div className="text-xs text-foreground/60">
            Showing {list.length} of {TEMPLATES.length} templates
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {list.length === 0 ? (
              <article className="rounded-xl border border-dashed border-border bg-background/40 p-6 text-center shadow-sm md:col-span-2 2xl:col-span-3">
                <div className="text-sm font-medium text-foreground">No templates match that search.</div>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={() => {
                    setQ("");
                    setActiveTab("All");
                  }}
                >
                  Show all templates
                </Button>
              </article>
            ) : list.map((t) => (
              <article
                key={t.key}
                className="flex flex-col rounded-xl border border-border bg-background/60 p-4 shadow-sm"
              >
                <div className="mb-1 flex items-start justify-between gap-2">
                  <div className="text-sm font-medium text-foreground">
                    {t.title}
                  </div>
                  <BookmarkButton
                    id={t.key}
                    scope="templates"
                    initial={savedIds.has(t.key)}
                    onToggle={(next) => handleSavedToggle(t.key, next)}
                  />
                </div>
                <div className="mb-2 text-xs text-foreground/60">{t.category}</div>
                <p className="mb-3 line-clamp-3 text-xs leading-relaxed text-foreground/70">
                  {renderTemplate(t.body, vars).replace(/\n+/g, " ")}
                </p>
                <div className="mb-3 flex flex-wrap gap-1">
                  {t.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-border text-foreground/80"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => setOpenKey(t.key)}
                    className="bg-primary-button text-primary-button-foreground hover:bg-primary-button/90"
                  >
                    Preview
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void handleCopy(t)}
                    className="border-border text-foreground hover:bg-foreground/[0.06]"
                  >
                    {copiedKey === t.key ? (
                      <><CheckIcon className="mr-1.5 h-3.5 w-3.5 text-success" /> Copied</>
                    ) : (
                      <><CopyIcon className="mr-1.5 h-3.5 w-3.5" /> Copy</>
                    )}
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>

      {/* Preview dialog (with Gmail compose shortcut for a11y) */}
      {active && (
        <TemplatePreview
          open={!!openKey}
          onOpenChange={(v) => !v && setOpenKey(null)}
          title={active.title}
          raw={active.body}
          vars={vars}
        />
      )}
      {active && !!openKey && (
        <div className="sr-only">
          <a href={gmailHref} target="_blank" rel="noreferrer">
            Compose in Gmail
          </a>
        </div>
      )}
    </div>
  );
}
