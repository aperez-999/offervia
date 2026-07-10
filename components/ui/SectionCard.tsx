import * as React from "react";
import type { LucideIcon } from "lucide-react";

type Props = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  title?: string;
  icon?: LucideIcon;
};

export function SectionCard({ children, className, style, id, title, icon: Icon }: Props) {
  const base =
    "rounded-2xl border border-border bg-card p-6 shadow-sm ring-1 ring-white/5 dark:ring-black/10";
  return (
    <section id={id} style={style} className={[base, className || ""].join(" ")}>
      {title ? (
        <div className="flex items-center gap-3">
          {Icon ? (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </div>
          ) : null}
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
        </div>
      ) : null}
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-foreground/80">
        {children}
      </div>
    </section>
  );
}
