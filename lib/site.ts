import { publicEnv } from "@/lib/env/public";

export const SITE_NAME = "Offervia";
export const SITE_DEFAULT_TITLE =
  "Offervia | Free job search tools for students and new grads";
export const SITE_DESCRIPTION =
  "Free job search tools for students and new grads. Paste a job posting, see what your resume is missing, and fix it before you apply. Then practice the interview and track every application.";
export const SITE_SHARE_IMAGE = "/og-image.png";

export { DISCUSSIONS_URL, GITHUB_REPO_URL, NEW_ISSUE_URL, suggestResourceUrl } from "@/lib/github";

export const SITE_SHARE_IMAGE_ALT =
  "Offervia: see what the job asks for, and show you have it";

/** Primary SEO keywords (used across metadata). */
export const SITE_KEYWORDS = [
  "free job search tools",
  "resume keyword scanner",
  "tailor resume to job description",
  "resume bullet checker",
  "cover letter",
  "mock interview practice",
  "job application tracker",
  "job offer comparison",
  "student job search",
  "new grad jobs",
];

export function getSiteUrl() {
  return (publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
