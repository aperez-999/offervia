import { getServiceSupabase } from "@/lib/supabase/service"

export type UsageFeature =
  | "resume_tailor"
  | "coach"
  | "job_scan"
  | "interview_session"
  | "cover_letter"

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7)
}

export async function incrementUsage(
  userId: string,
  feature: UsageFeature
) {
  const supabase = getServiceSupabase()
  const month = getCurrentMonth()

  const { data } = await supabase
    .from("usage_snapshots")
    .select("*")
    .eq("user_id", userId)
    .eq("month", month)
    .single()

  if (!data) {
    const insertRow: Record<string, number | string> = {
      user_id: userId,
      month,
      resume_tailor_count: feature === "resume_tailor" ? 1 : 0,
      coach_message_count: feature === "coach" ? 1 : 0,
      job_scan_count: feature === "job_scan" ? 1 : 0,
      interview_session_count: feature === "interview_session" ? 1 : 0,
      cover_letter_count: feature === "cover_letter" ? 1 : 0,
    }
    const { error } = await supabase.from("usage_snapshots").insert(insertRow)
    // Progressive fallbacks for databases missing the newest columns.
    if (error) {
      delete insertRow.cover_letter_count
      const retry = await supabase.from("usage_snapshots").insert(insertRow)
      if (retry.error) {
        delete insertRow.interview_session_count
        await supabase.from("usage_snapshots").insert(insertRow)
      }
    }
  } else {
    const updateRow: Record<string, number> = {
      resume_tailor_count:
        feature === "resume_tailor" ? data.resume_tailor_count + 1 : data.resume_tailor_count,
      coach_message_count:
        feature === "coach" ? data.coach_message_count + 1 : data.coach_message_count,
      job_scan_count:
        feature === "job_scan" ? data.job_scan_count + 1 : data.job_scan_count,
      interview_session_count:
        feature === "interview_session"
          ? (data.interview_session_count ?? 0) + 1
          : (data.interview_session_count ?? 0),
      cover_letter_count:
        feature === "cover_letter"
          ? (data.cover_letter_count ?? 0) + 1
          : (data.cover_letter_count ?? 0),
    }
    const { error } = await supabase
      .from("usage_snapshots")
      .update(updateRow)
      .eq("id", data.id)
    if (error) {
      delete updateRow.cover_letter_count
      const retry = await supabase
        .from("usage_snapshots")
        .update(updateRow)
        .eq("id", data.id)
      if (retry.error) {
        delete updateRow.interview_session_count
        await supabase.from("usage_snapshots").update(updateRow).eq("id", data.id)
      }
    }
  }
}
