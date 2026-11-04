"use client";

import { cn } from "@/lib/utils";

type ResumeWizardStep = {
  id: number;
  title: string;
};

export default function WizardSidebar({
  steps,
  current,
}: {
  steps: ResumeWizardStep[];
  current: number;
}) {
  return (
    <aside className="w-full shrink-0 lg:w-72">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-2 text-xs font-semibold text-foreground/60">
          Steps
        </div>
        <nav className="space-y-2">
          {steps.map((step, index) => {
            const active = current === step.id;
            return (
              <div
                key={step.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                  active
                    ? "border-primary/30 bg-primary/10 ring-1 ring-ring"
                    : "border-border"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs",
                    active ? "bg-primary-button text-white" : "bg-foreground/10 text-foreground/80"
                  )}
                >
                  {index + 1}
                </span>
                <span className="truncate text-sm text-foreground">{step.title}</span>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
