import { Skeleton } from "@/components/ui/skeleton";

export function ProfileSkeleton() {
  return (
    <div className="space-y-8 py-6 sm:py-8">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 shadow-sm">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-2 h-8 w-40" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[20rem_minmax(0,1fr)]">
        {/* Avatar card */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <Skeleton className="h-20 w-full rounded-none" />
          <div className="-mt-12 flex flex-col items-center px-6 pb-6 text-center">
            <Skeleton className="size-24 rounded-full" />
            <Skeleton className="mt-4 h-5 w-32" />
            <Skeleton className="mt-2 h-4 w-40" />
            <Skeleton className="mt-4 h-10 w-full rounded-md" />
          </div>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="mt-2 h-4 w-64" />
          <div className="mt-6 space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            ))}
            <Skeleton className="h-11 w-32 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
