export type ScanResultContent = {
  match_score: number;
  strengths: string[];
  missing_skills: string[];
  summary: string;
};

export type ScanEntry = {
  id: string;
  jd: string;
  result: string;
  created_at: number;
  title: string;
  techs: string[];
};

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
  "webpack",
  "vite",
  "rollup",
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
];

export function detectTechs(text: string): string[] {
  const hay = text.toLowerCase();
  const set = new Set<string>();
  for (const tech of TECH_DICT) {
    const rx =
      tech === "c++"
        ? /\bc\+\+\b/i
        : new RegExp(`(^|[^a-z0-9])${tech.replace(".", "\\.")}([^a-z0-9]|$)`, "i");
    if (rx.test(hay)) set.add(tech);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

export function titleFromJD(text: string): string {
  const first = text
    .split("\n")
    .map((segment) => segment.trim())
    .find(Boolean);
  const title = first || "Untitled scan";
  return title.length > 90 ? `${title.slice(0, 87)}…` : title;
}

export function approxTokens(input: string): number {
  return Math.max(1, Math.round(input.length / 4));
}

export function scanResultToText(result: ScanResultContent): string {
  const lines = [
    `Match Score: ${result.match_score}%`,
    "",
    "Strengths:",
    ...result.strengths.map((item) => `- ${item}`),
    "",
    "Missing Skills:",
    ...result.missing_skills.map((item) => `- ${item}`),
    "",
    "Summary:",
    result.summary,
  ];

  return lines.join("\n");
}
