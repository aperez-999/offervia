import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getUserSubscription } from "@/lib/subscription";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { readCareerProfile } from "@/lib/profile/read";
import { createPageMetadata } from "@/lib/metadata";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import InterviewStudio from "@/components/interview/InterviewStudio";
import InterviewHistory from "@/components/interview/InterviewHistory";
import type {
  InterviewDifficulty,
  InterviewFocus,
  PastInterview,
  TranscriptEntry,
} from "@/lib/interview/config";

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
  const career = await readCareerProfile(supabase, user.id);
  const pastSessions = await readPastInterviews(supabase, user.id);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Interview Prep"
        title="Mock interview studio"
        description="Practice with role-specific questions and get instant, scored feedback — then keep sharpening with the coach."
      />
      <InterviewStudio plan={subscription.plan} defaultRole={career.targetRole} />
      <InterviewHistory sessions={pastSessions} />
    </PageContainer>
  );
}

async function readPastInterviews(
  supabase: ReturnType<typeof createSupabaseServerClient>,
  userId: string,
): Promise<PastInterview[]> {
  try {
    const { data, error } = await supabase
      .from("interview_sessions")
      .select(
        "id, role_title, focus, difficulty, overall_score, summary, transcript, created_at",
      )
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(10);

    if (error || !data) return [];

    return data.map((row) => ({
      id: String(row.id),
      roleTitle: row.role_title ?? "",
      focus: (row.focus ?? "mixed") as InterviewFocus,
      difficulty: (row.difficulty ?? "standard") as InterviewDifficulty,
      overallScore: Number(row.overall_score ?? 0),
      summary: row.summary ?? "",
      transcript: Array.isArray(row.transcript)
        ? (row.transcript.filter(Boolean) as TranscriptEntry[])
        : [],
      createdAt: row.created_at ?? new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}
