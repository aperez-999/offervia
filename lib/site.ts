import { publicEnv } from "@/lib/env/public";

export const SITE_NAME = "Offervia";
export const SITE_DEFAULT_TITLE =
  "Offervia | Resume tailoring, job scanning, and interview practice";
export const SITE_DESCRIPTION =
  "A job search helper for students, new grads, and anyone applying. Check a posting against your resume, rewrite it, draft a cover letter, practice interviews, and track applications.";
export const SITE_SHARE_IMAGE = "/og-image.png";
export const SITE_SHARE_IMAGE_ALT =
  "Offervia: turn a job posting into a matching resume, cover letter, and tracked application";

/** Primary SEO keywords (used across metadata). */
export const SITE_KEYWORDS = [
  "resume tailoring",
  "ATS resume checker",
  "job description scanner",
  "cover letter draft",
  "interview practice",
  "job application tracker",
  "student job search",
  "resume optimizer",
  "job search tools",
  "career tools for job seekers",
];

export function getSiteUrl() {
  return (publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
