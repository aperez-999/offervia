import { cn } from "@/lib/utils";
import BrandMark from "./BrandMark";

/** Mark plus wordmark. Size it with a height class (h-7, h-8); text scales with it. */
export default function BrandLogo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex h-8 items-center gap-2", className)} role="img" aria-label="Offervia">
      <BrandMark className="h-full w-auto" />
      <span
        aria-hidden
        className="font-display text-[1.4rem] leading-none font-bold tracking-[-0.03em] text-foreground"
      >
        offervia
      </span>
    </span>
  );
}
