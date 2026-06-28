"use client";

import React, { useState } from "react";

// Function to clean and format AI response content
function formatContent(content: string, isAssistant: boolean): string {
  if (!isAssistant) {
    return content; // User messages don't need formatting
  }

  const formatted = content
    // Trim excessive newlines (3+ consecutive newlines become 2)
    .replace(/\n{3,}/g, "\n\n")
    // Remove markdown bold/italic syntax (**text**, *text*)
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    // Remove markdown headers (# ## ###)
    .replace(/^#{1,6}\s+/gm, "")
    // Convert markdown list markers to bullet points
    .replace(/^[\s]*[-*+]\s+/gm, "• ")
    // Remove markdown numbered lists (1. 2. etc.)
    .replace(/^[\s]*\d+\.\s+/gm, "")
    // Clean up any remaining markdown syntax
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // [text](url) -> text
    .replace(/`([^`]+)`/g, "$1") // `code` -> code
    // Add spacing after colons to improve readability
    .replace(/:\s*\n/g, ":\n\n")
    // Add spacing before bullet points for better visual separation
    .replace(/\n•/g, "\n\n•")
    // Ensure proper spacing around paragraphs
    .replace(/\n\n+/g, "\n\n")
    // Trim whitespace
    .trim();

  return formatted;
}

export default function MessageBubble({
  role,
  content,
}: {
  role: "user" | "assistant";
  content: string;
}) {
  const isUser = role === "user";
  const formattedContent = formatContent(content, !isUser);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Define character limit for truncation (detailed responses only)
  const CHARACTER_LIMIT = 500;
  const shouldTruncate = !isUser && formattedContent.length > CHARACTER_LIMIT;
  const displayContent = shouldTruncate && !isExpanded 
    ? formattedContent.substring(0, CHARACTER_LIMIT) + "..."
    : formattedContent;
  
  return (
    <div className={isUser ? "text-right" : "text-left"}>
      <div className="mb-1 text-xs text-foreground/60">
        {isUser ? "You" : "Coach"}
      </div>
      <div
        className={
          "inline-block max-w-[85%] rounded-xl px-4 py-3 text-sm shadow-sm border whitespace-pre-wrap leading-relaxed " +
          (isUser
            ? "bg-background/80 text-foreground border-border"
            : "bg-card/60 text-foreground border-border")
        }
      >
        {displayContent}
        {shouldTruncate && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2 text-xs text-primary hover:text-primary/90 underline"
          >
            {isExpanded ? "Show Less" : "Show More"}
          </button>
        )}
      </div>
    </div>
  );
}
