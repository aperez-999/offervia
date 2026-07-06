import { getServiceSupabase } from "@/lib/supabase/service"

export function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7)
}

export type UsageSnapshot = {
  resumeTailor: number
  coachMessages: number
  jobScans: number
  interviewSessions: number
}

export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  const supabase = getServiceSupabase()
  const month = getCurrentMonthKey()

  const primary = await supabase
    .from("usage_snapshots")
    .select("resume_tailor_count, coach_message_count, job_scan_count, interview_session_count")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle()

  let data = primary.data
  // Fallback for databases where the interview migration hasn't run yet.
  if (primary.error) {
    const legacy = await supabase
      .from("usage_snapshots")
      .select("resume_tailor_count, coach_message_count, job_scan_count")
      .eq("user_id", userId)
      .eq("month", month)
      .maybeSingle()
    data = legacy.data as typeof data
  }

  if (!data) {
    return { resumeTailor: 0, coachMessages: 0, jobScans: 0, interviewSessions: 0 }
  }

  return {
    resumeTailor: Number(data.resume_tailor_count) || 0,
    coachMessages: Number(data.coach_message_count) || 0,
    jobScans: Number(data.job_scan_count) || 0,
    interviewSessions: Number(data.interview_session_count) || 0,
  }
}
