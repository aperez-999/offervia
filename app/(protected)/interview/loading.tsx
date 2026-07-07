import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      {/* Setup card */}
      <div className="mx-auto w-full max-w-3xl">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
          <div className="border-b border-border px-6 py-6 sm:px-8">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
          </div>

          <div className="space-y-6 px-6 py-6 sm:px-8">
            {/* Role input */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-11 w-full rounded-md" />
            </div>

            {/* Focus options */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <div className="grid gap-2 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </div>

            {/* Difficulty options */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <div className="grid gap-2 sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </div>

            {/* Action row */}
            <div className="flex flex-col-reverse items-stretch gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-11 w-full rounded-md sm:w-44" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
