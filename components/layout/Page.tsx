import { cn } from "@/lib/utils";

/**
 * Shared page layout primitives. Every protected page should wrap its content
 * in <PageContainer> and lead with a <PageHeader> so spacing, rhythm, and
 * header treatment stay consistent across the app.
 */

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-8 py-6 sm:py-8", className)}>{children}</div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0 space-y-1.5">
        {eyebrow ? (
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
            <span
              aria-hidden
              className="h-3.5 w-1 rounded-full bg-primary/70"
            />
            {eyebrow}
          </div>
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-foreground/70">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/**
 * A labelled content block. Use for grouping related sections with a small
 * eyebrow + heading and consistent vertical rhythm.
 */
export function PageSection({
  eyebrow,
  title,
  description,
  actions,
  children,
  className,
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {title || eyebrow ? (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="space-y-1">
            {eyebrow ? (
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                <span
                  aria-hidden
                  className="h-3.5 w-1 rounded-full bg-primary/70"
                />
                {eyebrow}
              </div>
            ) : null}
            {title ? (
              <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            ) : null}
            {description ? (
              <p className="text-sm text-foreground/70">{description}</p>
            ) : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
