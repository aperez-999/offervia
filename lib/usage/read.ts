import { getServiceSupabase } from "@/lib/supabase/service"

export function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7)
}

export type UsageSnapshot = {
  resumeTailor: number
  coachMessages: number
  jobScans: number
}

export async function getUsageSnapshot(userId: string): Promise<UsageSnapshot> {
  const supabase = getServiceSupabase()
  const month = getCurrentMonthKey()

  const { data } = await supabase
    .from("usage_snapshots")
    .select("resume_tailor_count, coach_message_count, job_scan_count")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle()

  if (!data) {
    return { resumeTailor: 0, coachMessages: 0, jobScans: 0 }
  }

  return {
    resumeTailor: Number(data.resume_tailor_count) || 0,
    coachMessages: Number(data.coach_message_count) || 0,
    jobScans: Number(data.job_scan_count) || 0,
  }
}
