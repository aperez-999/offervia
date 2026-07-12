import { Skeleton } from "@/components/ui/skeleton";

// Fallback for the client-rendered Student Hub (it reads search params, so it
// suspends on load). Mirrors the tab bar + panel layout so refreshes show a
// skeleton instead of a blank gap under the page header.
export default function StudentHubSkeleton() {
  return (
    <div className="space-y-6">
      {/* Tab bar */}
      <div className="grid grid-cols-1 gap-2 rounded-2xl border border-border bg-card p-2 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-xl px-3.5 py-3">
            <Skeleton className="size-9 shrink-0 rounded-lg" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Panel */}
      <div className="grid gap-6 xl:grid-cols-[18rem_minmax(0,1fr)]">
        <Skeleton className="hidden h-64 w-full rounded-2xl xl:block" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
