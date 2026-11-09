import type { Metadata } from "next";
import { cookies } from "next/headers";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import { createPageMetadata } from "@/lib/metadata";
import { PageContainer } from "@/components/layout/Page";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { readCareerProfile } from "@/lib/profile/read";
import { readSavedResume } from "@/lib/profile/resume";
import { readAllowance } from "@/lib/usage/featureGate";

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
  title: "Tailor your resume",
  description: "Fit your resume to a specific job.",
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
  const [career, saved, allowance] = user?.id
    ? await Promise.all([
        readCareerProfile(supabase, user.id),
        readSavedResume(supabase, user.id),
        readAllowance(user.id, "resume_tailor"),
      ])
    : [null, null, null];

  return (
    <PageContainer>
      <ResumeWizard defaultRole={career?.targetRole ?? ""} savedResume={saved?.text ?? null} allowance={allowance} />
    </PageContainer>
  );
}
