import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      {/* Progress */}
      <div className="rounded-full border border-border bg-card p-1 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <Skeleton className="h-2 w-full rounded-full" />
      </div>

      <div className="flex gap-6">
        {/* Sidebar steps */}
        <aside className="w-56 shrink-0">
          <div className="rounded-xl border border-border bg-background p-3">
            <Skeleton className="h-3 w-20" />
            <div className="my-2 h-px bg-border" />
            <div className="space-y-2">
              {["Upload Resume", "Job Description", "Tailor & Review"].map((t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main panel */}
        <main className="flex-1 space-y-6">
          {/* Step card (title + description + drop area / textarea shape) */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-2 h-4 w-64" />
            {/* Dropzone / textarea placeholder */}
            <div className="mt-4 rounded-xl border-2 border-dashed border-border bg-background/60 p-4">
              <div className="mx-auto max-w-xl space-y-2 text-center">
                <Skeleton className="mx-auto h-10 w-10 rounded-lg" />
                <Skeleton className="mx-auto h-4 w-56" />
                <Skeleton className="mx-auto h-3 w-32" />
              </div>
            </div>
            {/* Field hint / error zone */}
            <div className="mt-3 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-40" />
            </div>
            {/* Actions */}
            <div className="mt-4 flex items-center justify-between">
              <Skeleton className="h-9 w-24 rounded-md" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-28 rounded-md" />
                <Skeleton className="h-9 w-28 rounded-md" />
              </div>
            </div>
          </div>

          {/* Review split (original vs AI) */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {[0, 1].map((col) => (
              <div
                key={col}
                className="rounded-xl border border-border bg-card p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10"
              >
                <Skeleton className="h-4 w-40" />
                <div className="mt-2 space-y-2">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-40 w-full rounded-lg" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>

          {/* Bottom nav */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-24 rounded-md" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-28 rounded-md" />
              <Skeleton className="h-9 w-28 rounded-md" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}