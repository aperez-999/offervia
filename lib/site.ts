import { publicEnv } from "@/lib/env/public";

export const SITE_NAME = "Offervia";
export const SITE_DEFAULT_TITLE = "Offervia | AI Job Search Copilot";
export const SITE_DESCRIPTION =
  "Scan job descriptions, tailor your resume, prepare for interviews, and track applications in one focused workspace.";
export const SITE_SHARE_IMAGE = "/og-image.png";
export const SITE_SHARE_IMAGE_ALT =
  "Offervia brand banner with the job search workflow tagline";

export function getSiteUrl() {
  return (publicEnv.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
