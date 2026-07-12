import { getServiceSupabase } from "@/lib/supabase/service"

export function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7)
}

export type UsageSnapshot = {
  resumeTailor: number
  coachMessages: number
  jobScans: number
  interviewSessions: number
  coverLetters: number
}

export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  const supabase = getServiceSupabase()
  const month = getCurrentMonthKey()

  const primary = await supabase
    .from("usage_snapshots")
    .select("resume_tailor_count, coach_message_count, job_scan_count, interview_session_count, cover_letter_count")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle()

  let data = primary.data
  // Progressive fallbacks for databases missing the newest columns.
  if (primary.error) {
    const withInterview = await supabase
      .from("usage_snapshots")
      .select("resume_tailor_count, coach_message_count, job_scan_count, interview_session_count")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle()
    if (withInterview.error) {
      const legacy = await supabase
        .from("usage_snapshots")
        .select("resume_tailor_count, coach_message_count, job_scan_count")
        .eq("user_id", userId)
        .eq("month", month)
        .maybeSingle()
      data = legacy.data as typeof data
    } else {
      data = withInterview.data as typeof data
    }
  }

  if (!data) {
    return { resumeTailor: 0, coachMessages: 0, jobScans: 0, interviewSessions: 0, coverLetters: 0 }
  }

  return {
    resumeTailor: Number(data.resume_tailor_count) || 0,
    coachMessages: Number(data.coach_message_count) || 0,
    jobScans: Number(data.job_scan_count) || 0,
    interviewSessions: Number(data.interview_session_count) || 0,
    coverLetters: Number((data as { cover_letter_count?: number }).cover_letter_count) || 0,
  }
}
