"use client";

import React from "react";

type WizardSidebarProps = {
  steps: { id: number; title: string }[];
  current: number;
};

export function WizardSidebar({ steps, current }: WizardSidebarProps) {
  return (
    <aside className="w-64 shrink-0">
      <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Wizard</div>
        <nav className="space-y-1 text-sm text-gray-700">
          {steps.map((s) => {
            const active = s.id === current;
            return (
              <div
                key={s.id}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 border ${
                  active ? "border-gray-300 bg-gray-50 font-medium" : "border-transparent"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className={`text-xs inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                  active ? "border-gray-400 bg-white" : "border-gray-200 bg-white"
                }`}>{s.id}</span>
                <span className="truncate">{s.title}</span>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
