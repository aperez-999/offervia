"use client";

import { CaretRight, ChatCircleText, Compass, EnvelopeSimple, FileText } from "@phosphor-icons/react/dist/ssr";
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
    label: "Interview practice",
    desc: "Practice questions and answers.",
    icon: ChatCircleText,
  },
  {
    key: "resume",
    label: "Resume feedback",
    desc: "Bullets, structure, results.",
    icon: FileText,
  },
  {
    key: "cover_letter",
    label: "Cover letter help",
    desc: "Openings, examples, tone.",
    icon: EnvelopeSimple,
  },
  {
    key: "career",
    label: "Career advice",
    desc: "Offers, promotions, pay.",
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
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div className="mb-2 text-xs font-semibold text-foreground/60">
          Topics
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
                    ? "border-primary/30 bg-primary/10"
                    : "border-transparent hover:bg-foreground/[0.06]"}
                `}
              >
                <span
                  className={`grid h-8 w-8 place-items-center rounded-lg border flex-shrink-0
                    ${selected
                      ? "border-primary/30 bg-primary/10 text-primary ring-1 ring-primary/20"
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

                <CaretRight
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