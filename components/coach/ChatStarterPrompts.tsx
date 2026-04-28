"use client";

import { Button } from "@/components/ui/button";
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

  return (
    <div>
      <p className="mb-2">{meta.intro}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {meta.prompts.map((prompt) => {
          const Icon = prompt.icon;
          return (
            <Button
              key={prompt.text}
              size="sm"
              variant="outline"
              className="cursor-pointer border-border text-foreground hover:bg-foreground/[0.06]"
              onClick={() => onPrompt(prompt.text)}
            >
              <Icon className="mr-1 h-4 w-4" />
              {prompt.text}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
