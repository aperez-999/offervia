import * as React from "react";

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={[
        "animate-pulse rounded-md bg-foreground/[0.06] dark:bg-white/[0.08]",
        className,
      ].join(" ")}
    />
  );
}