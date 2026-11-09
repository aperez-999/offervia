import { cn } from "@/lib/utils";

/**
 * The Offervia mark: a light "o" on a plum tile with a highlighter swipe
 * across it. Fixed brand colors in both themes. Pure shapes (no text) so the
 * same drawing works in app/icon.svg and in generated images.
 */
export const BRAND_COLORS = {
  plum: "#6B2D5C",
  highlight: "#D7F25A",
  paper: "#FBF8FA",
} as const;

export default function BrandMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <rect width="64" height="64" rx="15" fill={BRAND_COLORS.plum} />
      <rect
        x="9"
        y="33"
        width="46"
        height="13"
        rx="5"
        fill={BRAND_COLORS.highlight}
        transform="rotate(-7 32 39.5)"
      />
      <circle cx="32" cy="31" r="13" fill="none" stroke={BRAND_COLORS.paper} strokeWidth="7" />
    </svg>
  );
}
