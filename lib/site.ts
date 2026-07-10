import { publicEnv } from "@/lib/env/public";

export const SITE_NAME = "Offervia";
export const SITE_DEFAULT_TITLE =
  "Offervia — AI Resume Tailor, Job Scanner & Interview Coach";
export const SITE_DESCRIPTION =
  "Offervia turns any job description into a tailored, ATS-ready resume, cover letter, interview prep, and tracked application — one focused AI workflow for job seekers.";
export const SITE_SHARE_IMAGE = "/og-image.png";
export const SITE_SHARE_IMAGE_ALT =
  "Offervia — turn any job description into a tailored resume, cover letter, and tracked application";

/** Primary SEO keywords (used across metadata). */
export const SITE_KEYWORDS = [
  "AI resume builder",
  "resume tailoring",
  "ATS resume checker",
  "job description scanner",
  "cover letter generator",
  "AI interview coach",
  "job application tracker",
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
