import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      {/* Filters */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-9 w-40 rounded-md" />
        </div>
      </div>

      {/* Table shell */}
      <div className="rounded-2xl border border-border bg-card p-0 shadow-sm">
        {/* Header row */}
        <div className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] gap-4 border-b border-border p-4 text-sm">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>

        {/* Body rows */}
        <div className="divide-y divide-border">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="grid grid-cols-[2fr_2fr_1fr_1fr_1fr] items-center gap-4 p-4"
            >
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-4 w-52" />
              <Skeleton className="h-6 w-24 rounded-md" />
              <Skeleton className="h-4 w-24" />
              <div className="ml-auto flex justify-end gap-2">
                <Skeleton className="h-9 w-16 rounded-md" />
                <Skeleton className="h-9 w-16 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}