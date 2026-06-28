// app/(protected)/templates/loading.tsx

export default function Loading() {
    return (
      <div className="space-y-6" aria-busy="true" aria-live="polite" role="status">
        {/* Header */}
        <section>
          <div className="h-6 w-56 rounded bg-foreground/[0.08] animate-pulse" />
          <div className="mt-2 h-4 w-80 rounded bg-foreground/[0.06] animate-pulse" />
        </section>
  
        {/* Quick fill skeleton */}
        <section className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <div className="mb-3 h-4 w-24 rounded bg-foreground/[0.08] animate-pulse" />
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-9 rounded-md border border-border bg-foreground/[0.04] animate-pulse sm:col-span-1 lg:col-span-1" />
            ))}
            <div className="h-9 rounded-md border border-border bg-foreground/[0.04] animate-pulse sm:col-span-2" />
          </div>
        </section>
  
        {/* Tabs + search */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {[...Array(7)].map((_, i) => (
              <div key={i} className="h-8 w-20 rounded-md border border-border bg-foreground/[0.04] animate-pulse" />
            ))}
          </div>
          <div className="h-9 w-full sm:w-72 rounded-md border border-border bg-foreground/[0.04] animate-pulse" />
        </div>
  
        {/* Templates grid */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <article
              key={i}
              className="rounded-xl border border-border bg-background/60 p-4 shadow-sm"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="h-4 w-40 rounded bg-foreground/[0.08] animate-pulse" />
                <div className="h-5 w-5 rounded-full bg-foreground/[0.08] animate-pulse" />
              </div>
              <div className="mb-3 h-3 w-24 rounded bg-foreground/[0.06] animate-pulse" />
              <div className="mb-4 flex flex-wrap gap-2">
                <div className="h-6 w-16 rounded-md border border-border bg-foreground/[0.04] animate-pulse" />
                <div className="h-6 w-12 rounded-md border border-border bg-foreground/[0.04] animate-pulse" />
                <div className="h-6 w-20 rounded-md border border-border bg-foreground/[0.04] animate-pulse" />
              </div>
              <div className="h-8 w-24 rounded-md bg-primary/60 animate-pulse" />
            </article>
          ))}
        </div>
  
        <span className="sr-only">Loading templates…</span>
      </div>
    );
  }