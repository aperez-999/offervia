"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon, Copy as CopyIcon, Check as CheckIcon } from "lucide-react";
import TemplatePreview from "@/components/shared/TemplatePreview";
import BookmarkButton from "@/components/shared/BookmarkButton";
import { useToast } from "@/hooks/use-toast";

/** --------------------
 * Template data
 * Supports variables: {{name}}, {{role}}, {{company}}, {{contact}}, {{portfolio}}
 * -------------------- */
type Category =
  | "Outreach"
  | "Follow-up"
  | "Thank you"
  | "Referral"
  | "Negotiation"
  | "Ghosting"
  | "Recruiter";

type TemplateItem = {
  key: string;
  title: string;
  category: Category;
  tags: string[];
  body: string;
};

const TEMPLATES: TemplateItem[] = [
  {
    key: "outreach_cold_manager",
    title: "Cold outreach to hiring manager",
    category: "Outreach",
    tags: ["linkedin", "intro", "short"],
    body: `Hi {{contact}},

I’m {{name}}, a {{role}} excited about opportunities at {{company}}. I admire the team’s work and would love to briefly connect to learn where I could add value. Here’s my portfolio: {{portfolio}}.

If you’re open to it, could we set a 10–15 min chat this week? Thanks for your time!

Best,
{{name}}`,
  },
  {
    key: "follow_up_1wk",
    title: "Application follow-up (1 week)",
    category: "Follow-up",
    tags: ["status", "polite"],
    body: `Hi {{contact}},

I applied for the {{role}} role at {{company}} last week and wanted to check on status. I’m still very excited about the team and would love to help. Happy to provide anything helpful.

Thanks again for your time,
{{name}}`,
  },
  {
    key: "thanks_after_interview",
    title: "Thank-you after interview",
    category: "Thank you",
    tags: ["gratitude", "brief"],
    body: `Hi {{contact}},

Thanks again for the insightful conversation about {{role}}. I appreciated learning more about the team’s goals at {{company}}. Our discussion on impact and collaboration resonated with me.

Looking forward to next steps,
{{name}}`,
  },
  {
    key: "referral_warm",
    title: "Referral request (warm)",
    category: "Referral",
    tags: ["network", "linkedin"],
    body: `Hi {{contact}},

Hope you’ve been well! I’m applying to {{company}} for a {{role}} role and noticed your connection there. If you feel comfortable, would you be open to referring me? Here’s my portfolio: {{portfolio}}.

Totally understand if not—appreciate your time either way!

Thanks,
{{name}}`,
  },
  {
    key: "negotiation_opener",
    title: "Negotiation opener",
    category: "Negotiation",
    tags: ["comp", "offer"],
    body: `Hi {{contact}},

I’m excited about the offer for {{role}} at {{company}}. Based on scope and market levels, is there flexibility on base or signing to better align with expectations? I’m eager to make this work.

Thanks for considering,
{{name}}`,
  },
  {
    key: "ghosting_nudge",
    title: "Polite nudge after silence",
    category: "Ghosting",
    tags: ["nudge", "status"],
    body: `Hi {{contact}},

Following up on the {{role}} process at {{company}}—just checking if there are any updates you can share. I remain very interested and appreciate your time.

Best,
{{name}}`,
  },
  {
    key: "recruiter_reply_inbound",
    title: "Reply to inbound recruiter",
    category: "Recruiter",
    tags: ["inbound", "screen"],
    body: `Hi {{contact}},

Thanks for reaching out. I’m interested in learning more about the {{role}} opportunity at {{company}}. Here’s my portfolio: {{portfolio}}. Happy to share a resume as well.

Could we schedule a short intro call this week?

Best,
{{name}}`,
  },

  /** NEW #1 — Follow-up after onsite */
  {
    key: "follow_up_onsite_48h",
    title: "Follow-up after onsite (24–48h)",
    category: "Follow-up",
    tags: ["onsite", "thanks", "timeline"],
    body: `Hi {{contact}},

Thank you again for coordinating my onsite for the {{role}} role at {{company}}. It was great meeting the team and learning more about the challenges ahead.

I’m very excited about the fit. When you have a moment, could you share the expected timeline for next steps? Happy to provide any additional info.

Appreciate your time,
{{name}}`,
  },

  /** NEW #2 — Reschedule interview */
  {
    key: "reschedule_interview_conflict",
    title: "Reschedule interview (conflict)",
    category: "Recruiter",
    tags: ["scheduling", "polite", "conflict"],
    body: `Hi {{contact}},

I’m looking forward to the {{role}} interview with {{company}}. Unfortunately, an unavoidable conflict has come up at the scheduled time. Would it be possible to reschedule?

I’m flexible and available on these options:
• [Option 1]
• [Option 2]
• [Option 3]

Sorry for the inconvenience and thank you for your understanding.

Best,
{{name}}`,
  },
];

/** --------------------
 * UI state
 * -------------------- */
const VARS_KEY = "offervia:templateVars_v1";
const SAVES_KEY = "offervia:saves:templates";
const TABS: Array<"All" | "Saved" | Category> = [
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
function renderTemplate(raw: string, vars: Record<string, string | undefined>) {
  return raw.replace(/\{\{(\w+)\}\}/g, (_, k) => (vars[k]?.trim() ?? ""));
}

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
      toast({ variant: "success", title: "Template copied", description: "Personalized with your quick-fill details." });
    } catch {
      toast({ title: "Couldn’t copy", description: "Copy is unavailable in this browser.", variant: "destructive" });
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
      <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-6 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Outreach toolkit</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Templates</h1>
            <p className="mt-1 max-w-2xl text-sm text-foreground/70">
              Curated outreach, follow-up, and negotiation templates you can personalize quickly once the job context is clear.
            </p>
          </div>
          <div className="flex gap-2 text-center">
            <div className="rounded-xl border border-border bg-background/60 px-4 py-2">
              <div className="text-lg font-semibold text-foreground">{TEMPLATES.length}</div>
              <div className="text-[11px] uppercase tracking-wide text-foreground/60">Templates</div>
            </div>
            <div className="rounded-xl border border-border bg-background/60 px-4 py-2">
              <div className="text-lg font-semibold text-foreground">{savedIds.size}</div>
              <div className="text-[11px] uppercase tracking-wide text-foreground/60">Saved</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        {/* Rail: quick fill + categories */}
        <aside className="space-y-6 xl:sticky xl:top-24">
          <section className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <div className="mb-1 font-medium text-foreground">Quick fill</div>
            <p className="mb-3 text-xs text-foreground/60">
              Add your recurring details once so every preview and copy is personalized.
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
                placeholder="Recruiter / Contact name"
                value={vars.contact}
                onChange={(e) => setVars({ ...vars, contact: e.target.value })}
                className="border-border bg-background/80 text-foreground"
              />
              <Input
                placeholder="Portfolio / LinkedIn URL"
                value={vars.portfolio}
                onChange={(e) => setVars({ ...vars, portfolio: e.target.value })}
                className="border-border bg-background/80 text-foreground"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
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
                      ? "bg-primary-button text-white hover:bg-primary-button/90"
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
              placeholder="Search curated templates by title, category, or tag..."
              className="border-border bg-background/80 pl-9 text-foreground"
            />
          </div>

          <div className="text-xs text-foreground/60">
            Showing {list.length} of {TEMPLATES.length} templates
          </div>

          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {list.length === 0 ? (
              <article className="rounded-xl border border-dashed border-border bg-background/40 p-6 text-center shadow-sm md:col-span-2 2xl:col-span-3">
                <div className="text-sm font-medium text-foreground">No templates match this search.</div>
                <div className="mt-2 text-sm text-foreground/70">
                  Try another keyword or switch categories to find a template you can adapt.
                </div>
              </article>
            ) : list.map((t) => (
              <article
                key={t.key}
                className="card-hover flex flex-col rounded-xl border border-border bg-background/60 p-4 shadow-sm"
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
                    className="bg-primary-button text-white hover:bg-primary-button/90"
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
