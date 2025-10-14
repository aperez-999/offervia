"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, FileText, Mail, Compass } from "lucide-react";

const items = [
  { key: "interview", label: "Interview Coach", icon: MessageSquare },
  { key: "resume", label: "Resume Feedback", icon: FileText },
  { key: "cover_letter", label: "Cover Letter Help", icon: Mail },
  { key: "career", label: "Career Advice", icon: Compass },
] as const;

export default function CoachSidebar({ active, onChange }: { active: typeof items[number]["key"]; onChange: (k: typeof items[number]["key"]) => void; }) {
  return (
    <aside className="w-[260px] shrink-0">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-3">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Modules</div>
        <div className="flex flex-col gap-1">
          {items.map(({ key, label, icon: Icon }) => {
            const isActive = active === key;
            return (
              <Button
                key={key}
                variant="ghost"
                onClick={() => onChange(key)}
                className={`justify-start gap-2 px-2 py-2 text-sm hover:bg-gray-50 ${
                  isActive ? "bg-gray-50 font-medium" : ""
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
