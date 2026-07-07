import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Skeleton className="h-7 w-56" />
        <Skeleton className="mt-2 h-4 w-80" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar (Modules) */}
        <aside className="w-full shrink-0 lg:w-[260px]">
          <div className="rounded-xl border border-border bg-background p-3">
            <Skeleton className="h-3 w-24" />
            <div className="my-2 h-px bg-border" />
            <div className="space-y-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-2">
                  <Skeleton className="h-5 w-5 rounded-md" />
                  <Skeleton className="h-4 w-40" />
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Chat panel */}
        <main className="min-w-0 flex-1">
          <div className="flex h-[70vh] min-h-[420px] flex-col rounded-2xl border border-border bg-card/60 p-0 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
            {/* Chat header */}
            <div className="border-b border-border p-5">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="mt-2 h-4 w-72" />
            </div>

            {/* Messages list */}
            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              {/* Day chip */}
              <div className="mx-auto w-fit rounded-full border border-border bg-background/80 px-3 py-1 backdrop-blur">
                <Skeleton className="h-3 w-16" />
              </div>

              {/* Assistant bubble */}
              <div className="flex items-start gap-2">
                <Skeleton className="mt-1 h-5 w-5 rounded-full" />
                <div className="rounded-2xl border border-border bg-background/70 p-3">
                  <Skeleton className="h-4 w-64" />
                  <Skeleton className="mt-2 h-4 w-44" />
                </div>
              </div>

              {/* User bubble (right) */}
              <div className="flex items-start gap-2">
                <div className="ml-auto rounded-2xl border border-border bg-background/70 p-3">
                  <Skeleton className="h-4 w-56" />
                </div>
              </div>

              {/* Typing indicator */}
              <div className="flex items-start gap-2">
                <Skeleton className="mt-1 h-5 w-5 rounded-full" />
                <div className="rounded-2xl border border-border bg-primary/10 p-3">
                  <Skeleton className="h-4 w-40" />
                </div>
              </div>
            </div>

            {/* Input area */}
            <div className="border-t border-border p-4">
              <div className="flex items-center gap-2">
                <Skeleton className="h-11 w-full rounded-md" />
                <Skeleton className="h-11 w-24 rounded-md" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}