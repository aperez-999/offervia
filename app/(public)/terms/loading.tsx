export default function LoadingTerms() {
    return (
      <main className="mx-auto max-w-5xl px-4 py-16">
        <div className="mb-10 text-center">
          <div className="mx-auto h-6 w-40 rounded-full bg-foreground/[0.08] animate-pulse" />
          <div className="mx-auto mt-3 h-8 w-56 rounded-md bg-foreground/[0.08] animate-pulse" />
          <div className="mx-auto mt-2 h-4 w-80 rounded-md bg-foreground/[0.08] animate-pulse" />
        </div>
  
        <div className="grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="sticky top-20 hidden self-start lg:block">
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-6 w-44 rounded-md bg-foreground/[0.06] animate-pulse" />
              ))}
            </div>
          </aside>
  
          <article className="space-y-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
              >
                <div className="h-5 w-56 rounded-md bg-foreground/[0.08] animate-pulse" />
                <div className="mt-3 h-4 w-full rounded-md bg-foreground/[0.06] animate-pulse" />
                <div className="mt-2 h-4 w-4/5 rounded-md bg-foreground/[0.06] animate-pulse" />
              </div>
            ))}
          </article>
        </div>
      </main>
    );
  }