import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-60" />
        <Skeleton className="mt-2 h-4 w-96" />
      </div>

      {/* Category pills */}
      <div className="flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-28 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
        <Skeleton className="h-8 w-28 rounded-full" />
      </div>

      {/* Discount / perk cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="mt-1 h-3 w-28" />
              </div>
            </div>
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-10/12" />
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