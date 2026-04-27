import { cn } from "@/lib/utils";
import Image from "next/image";

export default function BrandIcon({
  size = 36,
  priority = false,
  className,
  framed = false,
}: {
  size?: number;
  priority?: boolean;
  className?: string;
  framed?: boolean;
}) {
  const image = (
    <Image
      src="/offervia-icon-square.png"
      alt="Offervia icon"
      width={size}
      height={size}
      priority={priority}
      className={cn("shrink-0", className)}
    />
  );

  if (!framed) return image;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border shadow-sm",
        "border-slate-200/90 bg-white/95 dark:border-white/12 dark:bg-slate-950/75"
      )}
      style={{ padding: Math.max(2, Math.round(size * 0.08)) }}
    >
      {image}
    </span>
  );
}
