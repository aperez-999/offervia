import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl space-y-10 py-6 sm:py-8">
      {/* Hero */}
      <div className="flex flex-col items-center space-y-3 text-center">
        <Skeleton className="h-6 w-32 rounded-full" />
        <Skeleton className="h-9 w-80 max-w-full" />
        <Skeleton className="h-4 w-full max-w-md" />
      </div>

      {/* Plan cards */}
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm sm:p-8">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-4 h-9 w-32" />
            <div className="mt-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
            <Skeleton className="mt-6 h-11 w-full rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}
