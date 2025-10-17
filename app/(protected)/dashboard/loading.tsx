import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      {/* KPIs */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
          >
            <Skeleton className="h-3 w-32" />
            <Skeleton className="mt-3 h-7 w-16" />
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-border bg-background/60 p-4 shadow-sm"
            >
              <Skeleton className="h-4 w-32" />
              <Skeleton className="mt-2 h-3 w-48" />
            </div>
          ))}
        </div>
      </div>

      {/* Two-up lists */}
      <div className="grid gap-4 lg:grid-cols-2">
        {[0, 1].map((k) => (
          <div
            key={k}
            className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
          >
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-4 w-56" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                  </div>
                  <Skeleton className="h-8 w-20 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}