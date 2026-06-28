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
  const isLight = mounted && resolvedTheme === "light";

  return (
    <span
      className={cn("relative inline-block w-auto", className)}
      style={{ aspectRatio: ASPECT }}
      aria-label="Offervia"
      role="img"
    >
      <Image
        src="/offervia-logo-dark.png"
        alt=""
        width={width}
        height={height}
        priority={priority}
        aria-hidden
        className={cn(
          "absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-out motion-reduce:transition-none",
          isLight ? "opacity-0" : "opacity-100",
        )}
      />
      <Image
        src="/offervia-logo-light.png"
        alt=""
        width={width}
        height={height}
        priority={priority}
        aria-hidden
        className={cn(
          "absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-out motion-reduce:transition-none",
          isLight ? "opacity-100" : "opacity-0",
        )}
      />
    </span>
  );
}
