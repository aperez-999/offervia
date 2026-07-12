import type { SupabaseClient } from "@supabase/supabase-js";
import { EMPTY_CAREER_PROFILE, type CareerProfile } from "@/lib/profile/career";

const CAREER_COLUMNS =
  "headline, target_role, seniority, key_skills, locations, work_pref, years_experience, bio";

type CareerRow = {
  headline: string | null;
  target_role: string | null;
  seniority: string | null;
  key_skills: string | null;
  locations: string | null;
  work_pref: string | null;
  years_experience: number | null;
  bio: string | null;
};

function rowToProfile(row: CareerRow): CareerProfile {
  return {
    headline: row.headline ?? "",
    targetRole: row.target_role ?? "",
    seniority: row.seniority ?? "",
    keySkills: row.key_skills ?? "",
    locations: row.locations ?? "",
    workPref: row.work_pref ?? "",
    yearsExperience: typeof row.years_experience === "number" ? row.years_experience : null,
    bio: row.bio ?? "",
  };
}

/**
 * Reads the career profile for a user. Returns EMPTY_CAREER_PROFILE if there's
 * no row, and also degrades gracefully to empty if the career migration hasn't
 * been applied yet (missing-column error), so AI features never crash on it.
 */
export async function readCareerProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<CareerProfile> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(CAREER_COLUMNS)
      .eq("id", userId)
      .maybeSingle();

    if (error || !data) return EMPTY_CAREER_PROFILE;
    return rowToProfile(data as unknown as CareerRow);
  } catch {
    return EMPTY_CAREER_PROFILE;
  }
}
