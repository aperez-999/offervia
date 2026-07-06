import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { createPageMetadata } from "@/lib/metadata";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import InterviewStudio from "@/components/interview/InterviewStudio";

export const metadata: Metadata = createPageMetadata({
  title: "Interview Prep",
  description:
    "Run a tailored mock interview, answer role-specific questions, and get scored, specific feedback on every answer.",
  path: "/interview",
  index: false,
});

export default async function InterviewPage() {
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

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Interview Prep"
        title="Mock interview studio"
        description="Practice with role-specific questions and get instant, scored feedback — then keep sharpening with the coach."
      />
      <InterviewStudio plan={subscription.plan} />
    </PageContainer>
  );
}
