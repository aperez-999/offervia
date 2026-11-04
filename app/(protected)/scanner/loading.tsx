import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-64" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      {/* Input card */}
      <div className="max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-sm">
        <Skeleton className="h-5 w-48" />
        <div className="mt-4 space-y-2">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-3 w-60" />
        </div>

        <div className="mt-4 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-48 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      {/* Results card */}
      <div className="max-w-3xl rounded-2xl border border-border bg-card p-5 shadow-sm">
        <Skeleton className="h-5 w-32" />
        <div className="mt-3 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[92%]" />
          <Skeleton className="h-4 w-[84%]" />
          <Skeleton className="h-4 w-[72%]" />
        </div>
      </div>
    </div>
  );
}