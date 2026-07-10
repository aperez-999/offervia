"use client";

import { MessageSquare, FileText, Mail, Compass, ChevronRight } from "lucide-react";
import type { CoachMode } from "./system-prompts";

type Item = {
  key: CoachMode;
  label: string;
  desc: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const ITEMS: Item[] = [
  {
    key: "interview",
    label: "Interview Coach",
    desc: "Prep, practice, concise answers.",
    icon: MessageSquare,
  },
  {
    key: "resume",
    label: "Resume Feedback",
    desc: "Bullets, structure, STAR impact.",
    icon: FileText,
  },
  {
    key: "cover_letter",
    label: "Cover Letter Help",
    desc: "Intros, proof points, tone.",
    icon: Mail,
  },
  {
    key: "career",
    label: "Career Advice",
    desc: "Decisions, growth, negotiation.",
    icon: Compass,
  },
];

export default function CoachSidebar({
  active,
  onChange,
}: {
  active: CoachMode;
  onChange: (k: CoachMode) => void;
}) {
  return (
    <aside className="w-full lg:w-[280px] shrink-0">
      <div className="rounded-2xl border border-border bg-card/60 p-3 shadow-sm ring-1 ring-white/5 backdrop-blur-sm dark:ring-black/10">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
          Modules
        </div>

        <nav className="flex flex-col lg:flex-col">
          {ITEMS.map(({ key, label, desc, icon: Icon }) => {
            const selected = key === active;
            return (
              <button
                key={key}
                type="button"
                aria-current={selected ? "page" : undefined}
                onClick={() => onChange(key)}
                className={`group mb-1 cursor-pointer flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors
                  ${selected
                    ? "border-primary/30 bg-gradient-to-br from-primary/[0.14] to-primary-button/[0.06]"
                    : "border-transparent hover:bg-foreground/[0.06]"}
                `}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg border flex-shrink-0
                    ${selected
                      ? "border-primary/30 bg-gradient-to-br from-primary/25 to-primary-button/20 text-primary ring-1 ring-primary/20"
                      : "border-border bg-background/80 text-foreground/70"}
                  `}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="flex-1 min-w-0">
                  <span
                    className={`block text-sm truncate ${selected ? "font-medium text-foreground" : "text-foreground"}`}
                  >
                    {label}
                  </span>
                  <span className="block text-xs text-foreground/60 truncate">{desc}</span>
                </span>

                <ChevronRight
                  className={`h-4 w-4 transition-colors flex-shrink-0
                    ${selected ? "text-primary" : "text-foreground/30 group-hover:text-foreground/50"}
                  `}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}