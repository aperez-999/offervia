"use client";

export const resumeWizardSteps = [
  { id: 1, title: "Upload Resume" },
  { id: 2, title: "Company Targeting" },
  { id: 3, title: "Job Description" },
  { id: 4, title: "Tailor & Review" },
] as const;

export const RESUME_ACCEPTED_TYPES = [".pdf", ".doc", ".docx"] as const;
export const RESUME_MAX_SIZE_MB = 8;

export const RESUME_JD_LS_KEY = "offervia:resume:jd_v1";
export const RESUME_DESIRED_STEP_LS_KEY = "offervia:resume:desiredStep_v1";

const TECH_DICT = [
  "react",
  "next.js",
  "typescript",
  "javascript",
  "node",
  "node.js",
  "graphql",
  "rest",
  "api",
  "html",
  "css",
  "tailwind",
  "redux",
  "jest",
  "rtl",
  "cypress",
  "testing",
  "vitest",
  "playwright",
  "aws",
  "gcp",
  "azure",
  "docker",
  "kubernetes",
  "sql",
  "postgres",
  "mysql",
  "mongodb",
  "python",
  "go",
  "java",
  "c++",
  "a11y",
  "accessibility",
  "performance",
] as const;

export function detectTechs(text: string): string[] {
  const hay = text.toLowerCase();
  const set = new Set<string>();

  for (const tech of TECH_DICT) {
    const pattern =
      tech === "c++"
        ? /\bc\+\+\b/i
        : new RegExp(`(^|[^a-z0-9])${tech.replace(".", "\\.")}([^a-z0-9]|$)`, "i");
    if (pattern.test(hay)) set.add(tech);
  }

  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function approxTokens(input: string) {
  return Math.max(1, Math.round((input || "").length / 4));
}

export function bytesToStr(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function normalizeText(value: string) {
  return value
    .replace(/\r\n/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\t/g, "  ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
