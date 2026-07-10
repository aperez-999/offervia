import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 py-6 sm:py-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-44" />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Section nav rail */}
        <div className="hidden rounded-2xl border border-border bg-card p-3 shadow-sm xl:block">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>

        {/* Settings sections */}
        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-4 w-64" />
              <div className="mt-6 space-y-4">
                <Skeleton className="h-11 w-full rounded-md" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
