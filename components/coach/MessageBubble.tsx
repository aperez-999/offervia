"use client";

import React from "react";

export default function MessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";
  return (
    <div className={isUser ? "text-right" : "text-left"}>
      <div className="mb-1 text-xs text-foreground/60">
        {isUser ? "You" : "Coach"}
      </div>
      <div
        className={
          "inline-block max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm border " +
          (isUser
            ? "bg-background/80 text-foreground border-border"
            : "bg-card/60 text-foreground border-border")
        }
      >
        {content}
      </div>
    </div>
  );
}
