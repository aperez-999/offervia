"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

// Intrinsic aspect ratio of the trimmed, transparent wordmark assets.
const ASPECT = 1609 / 391;

export default function BrandLogo({
  width = 176,
  height = 44,
  priority = false,
  className,
}: {
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  // Render both wordmarks and swap them purely with CSS via the `dark` class,
  // which next-themes injects on <html> before first paint. This avoids the
  // hydration flash (logo briefly rendering the wrong asset) you get when the
  // correct source is chosen inside a useEffect after mount.
  return (
    <span
      className={cn("relative inline-block w-auto", className)}
      style={{ aspectRatio: ASPECT }}
      aria-label="Offervia"
      role="img"
    >
      <Image
        src="/offervia-logo-light.png"
        alt=""
        width={width}
        height={height}
        priority={priority}
        aria-hidden
        className="h-full w-full object-contain dark:hidden"
      />
      <Image
        src="/offervia-logo-dark.png"
        alt=""
        width={width}
        height={height}
        priority={priority}
        aria-hidden
        className="hidden h-full w-full object-contain dark:block"
      />
    </span>
  );
}
