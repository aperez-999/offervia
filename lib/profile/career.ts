/**
 * Client-safe career-profile types, option lists, and prompt helpers.
 * No server-only imports — safe to use from client components and API routes.
 */

export type CareerProfile = {
  headline: string;
  targetRole: string;
  seniority: string;
  keySkills: string;
  locations: string;
  workPref: string;
  yearsExperience: number | null;
  bio: string;
};

export const EMPTY_CAREER_PROFILE: CareerProfile = {
  headline: "",
  targetRole: "",
  seniority: "",
  keySkills: "",
  locations: "",
  workPref: "",
  yearsExperience: null,
  bio: "",
};

export const SENIORITY_OPTIONS: { value: string; label: string }[] = [
  { value: "intern", label: "Intern / Student" },
  { value: "junior", label: "Junior (0–2 yrs)" },
  { value: "mid", label: "Mid-level (2–5 yrs)" },
  { value: "senior", label: "Senior (5–8 yrs)" },
  { value: "lead", label: "Lead / Staff (8+ yrs)" },
  { value: "manager", label: "Manager" },
];

export const WORK_PREF_OPTIONS: { value: string; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
  { value: "flexible", label: "Flexible" },
];

export function seniorityLabel(value: string): string {
  return SENIORITY_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function workPrefLabel(value: string): string {
  return WORK_PREF_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

/** True when the profile has enough signal to be worth injecting into prompts. */
export function hasCareerSignal(profile: CareerProfile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.targetRole ||
      profile.seniority ||
      profile.keySkills ||
      profile.headline ||
      profile.bio
  );
}

/**
 * Builds a compact context block describing the candidate, for injection into
 * AI system/user prompts. Returns an empty string when there's no signal so
 * callers can append unconditionally without changing behavior.
 */
export function buildProfileContext(profile: CareerProfile | null | undefined): string {
  if (!hasCareerSignal(profile)) return "";
  const p = profile as CareerProfile;
  const lines: string[] = [];
  if (p.headline) lines.push(`Headline: ${p.headline}`);
  if (p.targetRole) lines.push(`Target role: ${p.targetRole}`);
  if (p.seniority) lines.push(`Seniority: ${seniorityLabel(p.seniority)}`);
  if (typeof p.yearsExperience === "number")
    lines.push(`Years of experience: ${p.yearsExperience}`);
  if (p.keySkills) lines.push(`Key skills: ${p.keySkills}`);
  if (p.locations) lines.push(`Preferred locations: ${p.locations}`);
  if (p.workPref) lines.push(`Work preference: ${workPrefLabel(p.workPref)}`);
  if (p.bio) lines.push(`About the candidate: ${p.bio}`);
  return `Candidate profile (use to personalize; do not repeat verbatim):\n${lines.join("\n")}`;
}
