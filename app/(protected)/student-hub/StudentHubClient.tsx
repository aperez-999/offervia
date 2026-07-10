"use client";

import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, GraduationCap, Mail } from "lucide-react";
import TemplatesPanel from "@/components/student-hub/TemplatesPanel";
import ResourcesPanel from "@/components/student-hub/ResourcesPanel";
import DealsPanel from "@/components/student-hub/DealsPanel";

type TabKey = "templates" | "resources" | "deals";

const TABS: {
  key: TabKey;
  label: string;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "templates", label: "Message Templates", hint: "Outreach & follow-ups", icon: Mail },
  { key: "resources", label: "Learning Resources", hint: "Courses & practice", icon: BookOpen },
  { key: "deals", label: "Student Deals", hint: "Discounts & credits", icon: GraduationCap },
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
        className="grid grid-cols-1 gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm ring-1 ring-white/5 sm:grid-cols-3 dark:ring-black/10"
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
                <Icon className="h-[1.15rem] w-[1.15rem]" />
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
                <span className="block truncate text-xs text-foreground/55">{tab.hint}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Active panel */}
      <div role="tabpanel">{panel}</div>
    </div>
  );
}
