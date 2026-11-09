import type { SupabaseClient } from "@supabase/supabase-js";

/** Matches the check constraint in db/migrations/08_saved_resume.sql. */
export const MAX_RESUME_CHARS = 30000;
/** Shorter than this and the tools can't do much with it. */
export const MIN_RESUME_CHARS = 100;

export type SavedResume = {
  /** False until db/migrations/08_saved_resume.sql has been run. */
  available: boolean;
  text: string | null;
  updatedAt: string | null;
};

/**
 * The account's saved resume. Any error (most likely the migration hasn't run
 * yet) is treated as "not available", so the tools keep working without it.
 */
export async function readSavedResume(supabase: SupabaseClient, userId: string): Promise<SavedResume> {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("resume_text, resume_updated_at")
      .eq("id", userId)
      .maybeSingle();
    if (error) return { available: false, text: null, updatedAt: null };
    const text = typeof data?.resume_text === "string" && data.resume_text.trim() ? data.resume_text : null;
    return { available: true, text, updatedAt: (data?.resume_updated_at as string | null) ?? null };
  } catch {
    return { available: false, text: null, updatedAt: null };
  }
}

/** Clean up pasted or extracted resume text before saving it. */
export function normalizeResumeText(raw: string) {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, MAX_RESUME_CHARS);
}
