"use client";

import { CornerDownRight } from "lucide-react";
import type { CoachMode } from "./system-prompts";
import { COACH_MODE_META } from "./chat-config";

export default function ChatStarterPrompts({
  mode,
  onPrompt,
}: {
  mode: CoachMode;
  onPrompt: (text: string) => void;
}) {
  const meta = COACH_MODE_META[mode];
  const Icon = meta.icon;

  return (
    <div className="mx-auto max-w-md px-4">
      <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/20">
        <Icon className="size-6" />
      </span>
      <p className="mt-3 text-sm text-foreground/70">{meta.intro}</p>
      <div className="mt-4 grid gap-2 text-left">
        {meta.prompts.map((prompt) => {
          const PromptIcon = prompt.icon;
          return (
            <button
              key={prompt.text}
              type="button"
              onClick={() => onPrompt(prompt.text)}
              className="group flex w-full items-center gap-3 rounded-xl border border-border bg-background/50 px-3.5 py-2.5 text-left text-sm text-foreground transition-colors hover:border-primary/30 hover:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <PromptIcon className="size-4 shrink-0 text-primary" />
              <span className="flex-1">{prompt.text}</span>
              <CornerDownRight className="size-4 shrink-0 text-foreground/25 transition-colors group-hover:text-primary" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
