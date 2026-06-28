"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

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
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Default to the dark wordmark until the theme resolves to avoid a flash.
  // The swap is instant; smoothness during theme switches comes from the
  // View Transitions reveal (see lib/theme-transition.ts).
  const isLight = mounted && resolvedTheme === "light";
  const src = isLight ? "/offervia-logo-light.png" : "/offervia-logo-dark.png";

  return (
    <span
      className={cn("relative inline-block w-auto", className)}
      style={{ aspectRatio: ASPECT }}
      aria-label="Offervia"
      role="img"
    >
      <Image
        src={src}
        alt=""
        width={width}
        height={height}
        priority={priority}
        aria-hidden
        className="h-full w-full object-contain"
      />
    </span>
  );
}
