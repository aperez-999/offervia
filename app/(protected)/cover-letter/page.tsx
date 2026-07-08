import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { readCareerProfile } from "@/lib/profile/read";
import { createPageMetadata } from "@/lib/metadata";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import CoverLetterStudio from "@/components/cover-letter/CoverLetterStudio";

export const metadata: Metadata = createPageMetadata({
  title: "Cover Letter",
  description:
    "Generate a tailored, human-sounding cover letter from your resume and a job description in seconds.",
  path: "/cover-letter",
  index: false,
});

export default async function CoverLetterPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; company?: string }>;
}) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
  });

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    redirect("/login");
  }

  const subscription = await getUserSubscription(user.id);
  const career = await readCareerProfile(supabase, user.id);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Cover Letter"
        title="Cover letter generator"
        description="Turn your resume and a job description into a tailored, human-sounding cover letter — pick a tone and make it yours."
      />
      <CoverLetterStudio
        plan={subscription.plan}
        defaultRole={sp.role || career.targetRole}
        defaultCompany={sp.company || ""}
      />
    </PageContainer>
  );
}
