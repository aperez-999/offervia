import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

type ProCrestSize = "sm" | "md";

/**
 * Shared premium "Pro" badge. Uses the reserved brass `reward` accent so the
 * Pro identity reads consistently across the app shell, dashboard, and settings.
 */
export default function ProCrest({
  size = "sm",
  label = "Pro",
  className,
}: {
  size?: ProCrestSize;
  label?: string;
  className?: string;
}) {
  const sizes =
    size === "md"
      ? "gap-1.5 px-2.5 py-1 text-xs"
      : "gap-1 px-2 py-0.5 text-[10px]";
  const icon = size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-reward/40 bg-reward/15 font-semibold uppercase tracking-wide text-reward shadow-sm shadow-reward/10",
        sizes,
        className
      )}
      aria-label="Offervia Pro"
    >
      <Crown className={icon} aria-hidden />
      {label}
    </span>
  );
}
