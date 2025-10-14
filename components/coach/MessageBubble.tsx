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
      <div className="mb-1 text-xs text-gray-500">
        {isUser ? "You" : "Coach"}
      </div>
      <div
        className={
          "inline-block max-w-[85%] rounded-xl px-3 py-2 text-sm shadow-sm " +
          (isUser
            ? "bg-gray-50 text-gray-800 border border-gray-200"
            : "bg-white text-gray-900 border border-gray-200")
        }
      >
        {content}
      </div>
    </div>
  );
}
