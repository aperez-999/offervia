"use client";

import type { ReactNode } from "react";

export default function StepContainer({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
      <header>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}
