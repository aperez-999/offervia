import type { Metadata } from "next";
import { cookies } from "next/headers";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/metadata";
import { PageContainer } from "@/components/layout/Page";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { readCareerProfile } from "@/lib/profile/read";

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

export default async function ResumePage() {
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const career = user?.id ? await readCareerProfile(supabase, user.id) : null;

  return (
    <PageContainer>
      <ResumeWizard defaultRole={career?.targetRole ?? ""} />
    </PageContainer>
  );
}
