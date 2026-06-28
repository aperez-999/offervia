import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/metadata";
import { PageContainer } from "@/components/layout/Page";

const ScannerPanel = dynamic(() => import("@/components/scanner/ScannerPanel"), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="space-y-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  ),
});

export const metadata: Metadata = createPageMetadata({
  title: "Job Scanner",
  description: "Scan job descriptions for requirements, gaps, and stronger application angles before you tailor.",
  path: "/scanner",
  index: false,
});

export default function ScannerPage() {
  return (
    <PageContainer>
      <ScannerPanel />
    </PageContainer>
  );
}
