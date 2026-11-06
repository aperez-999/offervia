"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowSquareOut, BookOpen, EnvelopeSimple, GraduationCap } from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { suggestResourceUrl } from "@/lib/github";
import TemplatesPanel from "@/components/student-hub/TemplatesPanel";
import ResourcesPanel from "@/components/student-hub/ResourcesPanel";
import DealsPanel from "@/components/student-hub/DealsPanel";

type TabKey = "templates" | "resources" | "deals";

const TABS: {
  key: TabKey;
  label: string;
  hint: string;
  icon: PhosphorIcon;
}[] = [
  { key: "templates", label: "Message templates", hint: "Outreach and follow-ups", icon: EnvelopeSimple },
  { key: "resources", label: "Learning resources", hint: "Courses and practice", icon: BookOpen },
  { key: "deals", label: "Student deals", hint: "Discounts and credits", icon: GraduationCap },
];

function isTabKey(value: string | null): value is TabKey {
  return value === "templates" || value === "resources" || value === "deals";
}

export default function StudentHubClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("tab");
  const active: TabKey = isTabKey(raw) ? raw : "templates";

  const setTab = useCallback(
    (key: TabKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", key);
      router.replace(`/student-hub?${params.toString()}`, { scroll: false });
    },
    [router, searchParams]
  );

  const panel = useMemo(() => {
    switch (active) {
      case "resources":
        return <ResourcesPanel />;
      case "deals":
        return <DealsPanel />;
      default:
        return <TemplatesPanel />;
    }
  }, [active]);

  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Student Hub sections"
        className="grid grid-cols-1 gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm sm:grid-cols-3"
      >
        {TABS.map((tab) => {
          const selected = tab.key === active;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setTab(tab.key)}
              className={
                "group flex items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition-colors duration-200 " +
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background " +
                (selected
                  ? "border-primary bg-primary/10 shadow-[0_0_0_1px_var(--color-primary)]"
                  : "border-transparent hover:border-border hover:bg-foreground/[0.04] active:bg-foreground/[0.06]")
              }
            >
              <span
                className={
                  "grid size-9 shrink-0 place-items-center rounded-lg border transition-colors " +
                  (selected
                    ? "border-primary/30 bg-primary/15 text-primary"
                    : "border-border bg-background/60 text-foreground/70 group-hover:text-foreground")
                }
              >
                <Icon className="size-[1.15rem]" weight={selected ? "fill" : "duotone"} aria-hidden />
              </span>
              <span className="min-w-0">
                <span
                  className={
                    "block truncate text-sm font-semibold " +
                    (selected ? "text-foreground" : "text-foreground/80")
                  }
                >
                  {tab.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{tab.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div role="tabpanel">{panel}</div>

      <p className="text-sm text-muted-foreground">
        Know a free resource or student deal that belongs here?{" "}
        <a
          href={suggestResourceUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Suggest it on GitHub
          <ArrowSquareOut className="size-3.5" aria-hidden />
        </a>
      </p>
    </div>
  );
}
