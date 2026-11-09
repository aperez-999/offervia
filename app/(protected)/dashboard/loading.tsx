import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8 py-6 sm:py-8">
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-2xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-36 w-full rounded-2xl" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-56 w-full rounded-2xl" />
      </div>
    </div>
  );
}
