"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";

type Props = {
  /** Stable id for the thing being saved */
  id: string;
  /** Scope for localStorage key, e.g. "templates" */
  scope: string;
  /** Initial state from parent */
  initial?: boolean;
  /** Notify parent after a successful toggle */
  onToggle?: (saved: boolean) => void;
  className?: string;
  title?: string;
};

export default function BookmarkButton({
  id,
  scope,
  initial = false,
  onToggle,
  className,
  title = "Save",
}: Props) {
  const KEY = `offervia:saves:${scope}`;
  const [saved, setSaved] = useState<boolean>(initial);

  // Sync with localStorage changes from other tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      try {
        const arr: string[] = JSON.parse(e.newValue || "[]");
        setSaved(arr.includes(id));
      } catch {}
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [KEY, id]);

  // If parent changes `initial` (e.g. after first render), sync once
  useEffect(() => setSaved(initial), [initial]);

  function write(next: boolean) {
    try {
      const raw = localStorage.getItem(KEY);
      const arr: string[] = raw ? JSON.parse(raw) : [];
      const set = new Set(arr);
      if (next) set.add(id);
      else set.delete(id);
      localStorage.setItem(KEY, JSON.stringify(Array.from(set)));
    } catch {
      /* ignore */
    }
  }

  function toggle() {
    const next = !saved;
    setSaved(next);        // optimistic
    write(next);           // persist
    onToggle?.(next);      // tell parent so its filter updates immediately
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-pressed={saved}
      aria-label={saved ? "Saved" : title}
      title={saved ? "Saved" : title}
      className={["h-8 w-8 shrink-0 border border-border hover:bg-foreground/[0.06]", className]
        .filter(Boolean)
        .join(" ")}
    >
      <Bookmark
        className={`h-4 w-4 ${saved ? "fill-current text-indigo-600 dark:text-indigo-400" : "text-foreground/70"}`}
      />
    </Button>
  );
}