"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function BrandLogo({
  width = 190,
  height = 48,
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

  const src = mounted && resolvedTheme === "light" ? "/offervia-logo-light.png" : "/offervia-logo-dark.png";

  return (
    <Image
      src={src}
      alt="Offervia"
      width={width}
      height={height}
      priority={priority}
      className={cn("w-auto", className)}
    />
  );
}
