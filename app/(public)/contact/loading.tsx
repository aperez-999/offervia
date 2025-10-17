export default function LoadingContact() {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <header className="mb-8 text-center">
          <div className="mx-auto h-8 w-56 rounded-md bg-foreground/[0.08] animate-pulse" />
          <div className="mx-auto mt-2 h-4 w-80 rounded-md bg-foreground/[0.08] animate-pulse" />
        </header>
  
        <div className="mx-auto grid gap-4 rounded-2xl border border-border bg-card/60 p-6 shadow-sm ring-1 ring-white/5 dark:ring-black/10 sm:max-w-xl">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid gap-2">
              <div className="h-4 w-24 rounded-md bg-foreground/[0.08] animate-pulse" />
              <div className={`h-${i === 2 ? "32" : "10"} w-full rounded-lg border border-border bg-background/80`} />
            </div>
          ))}
          <div className="flex items-center justify-end">
            <div className="h-9 w-24 rounded-md bg-indigo-500/30 animate-pulse" />
          </div>
          <div className="h-3 w-64 place-self-center rounded-md bg-foreground/[0.06] animate-pulse" />
        </div>
      </main>
    );
  }