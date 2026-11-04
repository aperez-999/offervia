export default function Loading() {
    return (
      <main className="mx-auto max-w-7xl px-4 py-16">
        {/* Hero */}
        <section className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-3 h-6 w-40 rounded-full bg-foreground/[0.08] animate-pulse" />
          <div className="mx-auto h-8 w-72 rounded-md bg-foreground/[0.08] animate-pulse" />
          <div className="mx-auto mt-3 h-4 w-80 rounded-md bg-foreground/[0.08] animate-pulse" />
          <div className="mx-auto mt-6 flex justify-center gap-2">
            <div className="h-9 w-28 rounded-md bg-primary/10 animate-pulse" />
            <div className="h-9 w-28 rounded-md bg-foreground/[0.08] animate-pulse" />
          </div>
        </section>
  
        {/* Features grid */}
        <section className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <div className="h-5 w-28 rounded-md bg-foreground/[0.08] animate-pulse" />
              <div className="mt-3 h-4 w-full rounded-md bg-foreground/[0.06] animate-pulse" />
              <div className="mt-2 h-4 w-3/4 rounded-md bg-foreground/[0.06] animate-pulse" />
            </div>
          ))}
        </section>
      </main>
    );
  }