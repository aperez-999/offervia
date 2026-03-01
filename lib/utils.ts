import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Percentage of used vs limit (0–100). */
export function usagePct(used: number, limit: number): number {
  return limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0
}

/** Display state from usage percentage. */
export function usageState(pct: number): "low" | "warn" | "high" {
  if (pct >= 100) return "high"
  if (pct >= 70) return "warn"
  return "low"
}
