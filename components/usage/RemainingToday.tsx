"use client";

import { useCallback, useEffect, useState } from "react";
import { remainingNote, type AllowanceSnapshot, type GatedFeature } from "@/lib/usage/limits";
import { cn } from "@/lib/utils";

/**
 * Today's remaining uses for one tool, kept in step after each success.
 * `consume()` after a successful run; `blocked` disables the button at zero.
 */
export function useRemainingToday(initial: AllowanceSnapshot | null | undefined) {
  const [remaining, setRemaining] = useState(initial?.remaining ?? Infinity);
  // Only the server knows exactly when the oldest use expires. After a local
  // countdown the note falls back to "within 24 hours" rather than guessing.
  const resetsAt = initial?.remaining === remaining ? (initial?.resetsAt ?? null) : null;

  const consume = useCallback(() => {
    setRemaining((r) => (Number.isFinite(r) ? Math.max(0, r - 1) : r));
  }, []);

  return { remaining, resetsAt, consume, blocked: remaining <= 0 };
}

/** Small note under a tool's main button. Renders nothing while plenty are left. */
export function RemainingToday({
  feature,
  remaining,
  resetsAt,
  className,
}: {
  feature: GatedFeature;
  remaining: number;
  resetsAt: string | null;
  className?: string;
}) {
  // Format on the client only, so the time is in the reader's own zone.
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => {
    setNote(Number.isFinite(remaining) ? remainingNote(feature, remaining, resetsAt) : null);
  }, [feature, remaining, resetsAt]);

  if (!note) return null;
  return (
    <p
      role="status"
      className={cn("text-xs", remaining <= 0 ? "text-warning" : "text-muted-foreground", className)}
    >
      {note}
    </p>
  );
}
