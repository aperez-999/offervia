import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 py-6 sm:py-8">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
      </div>

      {/* Step tracker */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-24 w-full rounded-2xl" />
        ))}
      </div>

      {/* Active step body */}
      <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-80" />
        <Skeleton className="mt-6 h-40 w-full rounded-xl" />
        <div className="mt-4 flex justify-end gap-2">
          <Skeleton className="h-11 w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}
