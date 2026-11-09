import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { readCareerProfile } from "@/lib/profile/read";
import { readSavedResume } from "@/lib/profile/resume";
import { readAllowance } from "@/lib/usage/featureGate";
import { createPageMetadata } from "@/lib/metadata";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import CoverLetterStudio from "@/components/cover-letter/CoverLetterStudio";

export const metadata: Metadata = createPageMetadata({
  title: "Cover letter",
  description:
    "Write a cover letter for a specific job.",
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

  const [career, saved, allowance] = await Promise.all([
    readCareerProfile(supabase, user.id),
    readSavedResume(supabase, user.id),
    readAllowance(user.id, "cover_letter"),
  ]);

  return (
    <PageContainer>
      <PageHeader
        title="Cover letter"
        description="Write a letter for a specific job, in the tone you want."
      />
      <CoverLetterStudio
        defaultRole={sp.role || career.targetRole}
        defaultCompany={sp.company || ""}
        savedResume={saved.text}
        allowance={allowance}
      />
    </PageContainer>
  );
}
