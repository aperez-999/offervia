import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      {/* Two-column studio */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Inputs */}
        <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm">
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-40 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
            <div className="flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-28 rounded-full" />
              ))}
            </div>
            <Skeleton className="h-11 w-full rounded-md" />
          </div>
        </div>

        {/* Output */}
        <div className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm">
          <Skeleton className="h-5 w-40" />
          <div className="mt-6 space-y-3">
            {["w-[90%]", "w-[78%]", "w-[66%]", "w-[88%]", "w-[80%]", "w-[70%]", "w-[85%]", "w-[60%]"].map(
              (w, i) => (
                <Skeleton key={i} className={`h-4 rounded ${w}`} />
              ),
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
