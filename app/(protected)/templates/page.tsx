"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search as SearchIcon } from "lucide-react";
import TemplatePreview from "@/components/shared/TemplatePreview";
import BookmarkButton from "@/components/shared/BookmarkButton";
import { motion } from "framer-motion";

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

export default function TemplatesPage() {
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="space-y-4 sm:space-y-6 p-4 sm:p-6"
    >
      <div className="rounded-2xl border border-border bg-card/60 p-4 sm:p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <h1 className="text-2xl font-semibold text-foreground">Templates</h1>
        <p className="mt-1 text-sm text-foreground/70">
          Curated outreach, follow-up, and negotiation templates you can personalize quickly once the job context is clear.
        </p>
      </div>

      {/* Quick fill */}
      <section className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <div className="mb-1 font-medium text-foreground">Quick fill</div>
        <p className="mb-3 text-xs text-foreground/60">
          Add your recurring details once so every template preview is easier to personalize.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
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
            className="border-border bg-background/80 text-foreground sm:col-span-2 lg:col-span-1"
          />
          <Input
            placeholder="Portfolio / LinkedIn URL"
            value={vars.portfolio}
            onChange={(e) => setVars({ ...vars, portfolio: e.target.value })}
            className="border-border bg-background/80 text-foreground sm:col-span-2"
          />
        </div>
      </section>

      {/* Tabs + search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Button
              key={t}
              size="sm"
              variant={activeTab === t ? "default" : "outline"}
              onClick={() => setActiveTab(t)}
              className={
                activeTab === t
                  ? "bg-indigo-600 text-white hover:bg-indigo-500"
                  : "border-border text-foreground hover:bg-foreground/[0.06]"
              }
            >
              {t}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <SearchIcon className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/50" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search curated templates..."
            className="border-border bg-background/80 pl-8 text-foreground"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.length === 0 ? (
          <article className="rounded-xl border border-dashed border-border bg-background/40 p-6 text-center shadow-sm md:col-span-2 xl:col-span-3">
            <div className="text-sm font-medium text-foreground">No templates match this search.</div>
            <div className="mt-2 text-sm text-foreground/70">
              Try another keyword or switch categories to find a template you can adapt.
            </div>
          </article>
        ) : list.map((t) => (
          <article
            key={t.key}
            className="rounded-xl border border-border bg-background/60 p-4 shadow-sm"
          >
            <div className="mb-1 flex items-center justify-between">
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
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setOpenKey(t.key)}
                className="bg-indigo-600 text-white hover:bg-indigo-500"
              >
                Preview
              </Button>
            </div>
          </article>
        ))}
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
    </motion.div>
  );
}
