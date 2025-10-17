import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      {/* Filters / chips */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-16 rounded-full" />
      </div>

      {/* Cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
          >
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-4 w-48" />
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-11/12" />
              <Skeleton className="h-3 w-4/5" />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}