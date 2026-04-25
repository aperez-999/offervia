import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/metadata";

const ResumeWizard = dynamic(() => import("@/components/resume/ResumeWizard"), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="space-y-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  ),
});

export const metadata: Metadata = createPageMetadata({
  title: "Resume Tailor",
  description: "Tailor your resume to each role with clearer inputs, stronger drafts, and faster iteration.",
  path: "/resume",
  index: false,
});

export default function ResumePage() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <ResumeWizard />
    </div>
  );
}
