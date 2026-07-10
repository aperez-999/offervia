export type KeywordImportance = "must" | "nice";

export type RawKeyword = { term: string; importance: KeywordImportance };

export type ScoredKeyword = {
  term: string;
  importance: KeywordImportance;
  matched: boolean;
};

export type AtsResult = {
  role_title: string;
  match_score: number;
  matched_count: number;
  total: number;
  must_total: number;
  must_matched: number;
  keywords: ScoredKeyword[];
  matched: string[];
  missing: string[];
  missing_must: string[];
  tips: string[];
};

export type AtsHistoryEntry = {
  id: string;
  created_at: number;
  role_title: string;
  match_score: number;
  jd_excerpt: string;
};

export const ATS_HISTORY_LS_KEY = "offervia:atsHistory_v1";
export const ATS_RESUME_JD_LS_KEY = "offervia:resume:jd_v1";
export const ATS_RESUME_DESIRED_STEP_LS_KEY = "offervia:resume:desiredStep_v1";

/** Lowercase, replace non-alphanumeric with spaces, collapse whitespace. */
export function normalizeForMatch(s: string): string {
  return ` ${(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()} `;
}

/** Alphanumeric-only collapse, e.g. "Node.js" -> "nodejs", "CI/CD" -> "cicd". */
function collapse(s: string): string {
  return (s || "").toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * Determine whether a JD keyword appears in the resume text.
 * Uses a normalized word-boundary check plus an alphanumeric-collapsed
 * fallback so "Node.js" matches "nodejs" and "CI/CD" matches "ci cd".
 */
export function resumeHasTerm(
  resumeNorm: string,
  resumeCollapsed: string,
  term: string,
): boolean {
  const t = (term || "").trim();
  if (!t) return false;

  const normTerm = normalizeForMatch(t).trim();
  if (normTerm && resumeNorm.includes(` ${normTerm} `)) return true;

  const collapsedTerm = collapse(t);
  if (collapsedTerm.length >= 3 && resumeCollapsed.includes(collapsedTerm)) {
    return true;
  }

  return false;
}

/** Dedupe keywords by normalized term, keeping the strongest importance. */
export function dedupeKeywords(keywords: RawKeyword[]): RawKeyword[] {
  const map = new Map<string, RawKeyword>();
  for (const k of keywords) {
    const term = (k?.term || "").trim();
    if (!term) continue;
    const key = collapse(term);
    if (!key) continue;
    const importance: KeywordImportance = k.importance === "must" ? "must" : "nice";
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { term, importance });
    } else if (existing.importance !== "must" && importance === "must") {
      map.set(key, { term, importance: "must" });
    }
  }
  return Array.from(map.values());
}

/**
 * Score a resume against extracted JD keywords. Must-have keywords are
 * weighted 2x. Returns a full ATS result with matched/missing splits + tips.
 */
export function scoreAts(
  resumeText: string,
  keywords: RawKeyword[],
  roleTitle: string,
): AtsResult {
  const resumeNorm = normalizeForMatch(resumeText);
  const resumeCollapsed = collapse(resumeText);
  const deduped = dedupeKeywords(keywords);

  const scored: ScoredKeyword[] = deduped.map((k) => ({
    term: k.term,
    importance: k.importance,
    matched: resumeHasTerm(resumeNorm, resumeCollapsed, k.term),
  }));

  let weightTotal = 0;
  let weightMatched = 0;
  let mustTotal = 0;
  let mustMatched = 0;
  for (const k of scored) {
    const w = k.importance === "must" ? 2 : 1;
    weightTotal += w;
    if (k.matched) weightMatched += w;
    if (k.importance === "must") {
      mustTotal += 1;
      if (k.matched) mustMatched += 1;
    }
  }

  const match_score =
    weightTotal > 0 ? Math.round((weightMatched / weightTotal) * 100) : 0;

  const matched = scored.filter((k) => k.matched).map((k) => k.term);
  const missing = scored.filter((k) => !k.matched).map((k) => k.term);
  const missing_must = scored
    .filter((k) => !k.matched && k.importance === "must")
    .map((k) => k.term);

  return {
    role_title: roleTitle || "This role",
    match_score,
    matched_count: matched.length,
    total: scored.length,
    must_total: mustTotal,
    must_matched: mustMatched,
    keywords: scored,
    matched,
    missing,
    missing_must,
    tips: buildTips(match_score, missing_must, missing),
  };
}

function buildTips(
  score: number,
  missingMust: string[],
  missing: string[],
): string[] {
  const tips: string[] = [];

  if (missingMust.length) {
    const list = missingMust.slice(0, 6).join(", ");
    tips.push(
      `Add the required keywords the resume is missing where you genuinely have them: ${list}.`,
    );
  } else if (missing.length) {
    const list = missing.slice(0, 6).join(", ");
    tips.push(
      `Work in these preferred keywords where they apply to your experience: ${list}.`,
    );
  } else {
    tips.push("Strong keyword coverage — your resume mirrors this job's language well.");
  }

  if (score < 60) {
    tips.push(
      "Mirror the job's exact phrasing (e.g. use \"CI/CD\" if the JD does) — ATS matching is literal.",
    );
  }

  tips.push(
    "Put key skills in a plain-text \"Skills\" section; avoid tables, columns, and images that ATS parsers drop.",
  );
  tips.push(
    "Spell out acronyms once with the full term (e.g. \"Search Engine Optimization (SEO)\") so both forms match.",
  );

  return tips;
}

/** Coerce an arbitrary parsed value into a clean RawKeyword[]. */
export function coerceKeywords(input: unknown): RawKeyword[] {
  if (!Array.isArray(input)) return [];
  const out: RawKeyword[] = [];
  for (const item of input) {
    if (item && typeof item === "object") {
      const term = String((item as Record<string, unknown>).term ?? "").trim();
      const imp = String((item as Record<string, unknown>).importance ?? "nice");
      if (term) {
        out.push({ term, importance: imp === "must" ? "must" : "nice" });
      }
    } else if (typeof item === "string" && item.trim()) {
      out.push({ term: item.trim(), importance: "nice" });
    }
  }
  return out;
}
