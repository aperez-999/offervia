/**
 * Rule-based resume bullet checker. No AI, no network: it runs in the browser
 * as you type. Each rule is something a recruiter or career advisor would
 * point out on a first read.
 */

export type BulletIssueKind =
  | "weak-opener"
  | "no-number"
  | "first-person"
  | "filler"
  | "too-long"
  | "too-short"
  | "tense";

export type BulletIssue = {
  kind: BulletIssueKind;
  message: string;
  fix: string;
  /** Character ranges in the bullet to underline. */
  spans: Array<[start: number, end: number]>;
};

export type BulletVerdict = "strong" | "okay" | "needs-work";

export type BulletReport = {
  text: string;
  issues: BulletIssue[];
  verdict: BulletVerdict;
  tense: "past" | "present" | "unknown";
};

export type BulletSummary = {
  bullets: BulletReport[];
  strong: number;
  needsWork: number;
  /** How many bullets have each kind of issue. */
  counts: Partial<Record<BulletIssueKind, number>>;
};

export const MAX_WORDS = 30;
export const MIN_WORDS = 6;

const WEAK_OPENERS = [
  "responsible for",
  "duties included",
  "tasked with",
  "in charge of",
  "involved in",
  "participated in",
  "worked on",
  "worked with",
  "helped with",
  "helped to",
  "helped",
  "assisted with",
  "assisted in",
  "assisted",
  "handled",
  "was part of",
];

const FILLER = [
  "various",
  "several",
  "successfully",
  "effectively",
  "efficiently",
  "very",
  "really",
  "a lot of",
  "etc",
  "team player",
  "hard-working",
  "hardworking",
  "detail-oriented",
  "go-getter",
  "synergy",
  "utilized",
  "utilize",
  "leveraged",
];

const NUMBER_WORDS =
  /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|hundred|hundreds|thousand|thousands|million|millions|dozen|dozens|double|doubled|tripled|half|halved)\b/i;

const IRREGULAR_PAST = new Set([
  "built", "led", "ran", "wrote", "made", "grew", "cut", "won", "taught", "drove", "sold",
  "began", "brought", "chose", "did", "drew", "found", "gave", "held", "kept", "met", "paid",
  "set", "spoke", "took", "thought", "told", "went", "oversaw", "rebuilt", "rewrote", "spent",
  "sent", "lent", "shot", "stood", "understood", "won", "bought", "caught", "fought", "sought",
]);

const PRESENT_VERBS = new Set([
  "manage", "lead", "build", "develop", "design", "create", "run", "write", "teach",
  "coordinate", "analyze", "support", "maintain", "implement", "improve", "plan", "organize",
  "train", "mentor", "own", "drive", "ship", "launch", "test", "review", "prepare", "present",
  "handle", "oversee", "deliver", "serve", "track", "help", "work", "assist", "conduct",
  "collaborate", "partner", "research", "monitor", "schedule", "process", "operate", "sell",
]);

/** Split pasted text into bullets: one per line, list markers removed. */
export function splitBullets(input: string): string[] {
  return input
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-*•‣◦▪●–—]|\d+[.)])\s*/, "").trim())
    .filter((line) => line.length > 0);
}

function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length;
}

function findAll(text: string, phrase: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  const re = new RegExp(`(?<![\\w-])${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`, "gi");
  for (const m of text.matchAll(re)) out.push([m.index!, m.index! + m[0].length]);
  return out;
}

export function detectTense(text: string): BulletReport["tense"] {
  const first = text.match(/^[A-Za-z][A-Za-z-]*/)?.[0]?.toLowerCase();
  if (!first) return "unknown";
  if (IRREGULAR_PAST.has(first) || (first.length > 3 && first.endsWith("ed"))) return "past";
  if (PRESENT_VERBS.has(first) || (first.endsWith("s") && PRESENT_VERBS.has(first.slice(0, -1)))) {
    return "present";
  }
  return "unknown";
}

function checkOne(text: string): Omit<BulletReport, "verdict"> {
  const issues: BulletIssue[] = [];
  const lower = text.toLowerCase();

  const opener = WEAK_OPENERS.find((p) => lower.startsWith(p + " ") || lower === p);
  if (opener) {
    issues.push({
      kind: "weak-opener",
      message: `"${text.slice(0, opener.length)}" describes a duty, not something you did.`,
      fix: "Start with a strong verb for what you actually did: Built, Led, Cut, Grew, Wrote, Launched.",
      spans: [[0, opener.length]],
    });
  }

  if (!/\d/.test(text) && !NUMBER_WORDS.test(text)) {
    issues.push({
      kind: "no-number",
      message: "No number or measurable result.",
      fix: "Add one number: how many people, how much money or time, how fast, or how often.",
      spans: [],
    });
  }

  const pronounSpans: Array<[number, number]> = [];
  for (const m of text.matchAll(/\b(I|me|my|myself|we|our|us)\b/g)) {
    if (m[0] !== "I" && m[0] !== m[0].toLowerCase()) continue;
    pronounSpans.push([m.index!, m.index! + m[0].length]);
  }
  if (pronounSpans.length) {
    issues.push({
      kind: "first-person",
      message: "Resume bullets usually leave out I, me, my, and we.",
      fix: "Drop the pronoun and start with the verb.",
      spans: pronounSpans,
    });
  }

  const fillerSpans = FILLER.flatMap((f) => findAll(text, f)).sort((a, b) => a[0] - b[0]);
  if (fillerSpans.length) {
    const words = [...new Set(fillerSpans.map(([a, b]) => text.slice(a, b).toLowerCase()))];
    issues.push({
      kind: "filler",
      message: `Filler that doesn't add information: ${words.map((w) => `"${w}"`).join(", ")}.`,
      fix: "Cut it, or replace it with the specific detail it stands in for.",
      spans: fillerSpans,
    });
  }

  const words = wordCount(text);
  if (words > MAX_WORDS) {
    issues.push({
      kind: "too-long",
      message: `${words} words. Most recruiters skim, and long bullets get skipped.`,
      fix: `Keep it under ${MAX_WORDS} words: what you did, how, and the result.`,
      spans: [],
    });
  } else if (words < MIN_WORDS) {
    issues.push({
      kind: "too-short",
      message: "Too short to show what you did or why it mattered.",
      fix: "Add the result: what changed because of your work?",
      spans: [],
    });
  }

  return { text, issues, tense: detectTense(text) };
}

function verdictFor(issues: BulletIssue[]): BulletVerdict {
  if (issues.length === 0) return "strong";
  if (issues.length === 1 && issues[0].kind !== "weak-opener") return "okay";
  return "needs-work";
}

export function checkBullets(input: string): BulletSummary {
  const reports = splitBullets(input).map(checkOne);

  // Tense: only flag a bullet when the list clearly leans the other way.
  // Mixed tense can be right (current job vs. past jobs), so say so.
  const past = reports.filter((r) => r.tense === "past").length;
  const present = reports.filter((r) => r.tense === "present").length;
  const majority = past >= 2 && past >= present * 2 ? "past" : present >= 2 && present >= past * 2 ? "present" : null;
  if (majority) {
    for (const r of reports) {
      if (r.tense !== "unknown" && r.tense !== majority) {
        const firstWord = r.text.match(/^\S+/)?.[0] ?? "";
        r.issues.push({
          kind: "tense",
          message: `This one is in ${r.tense} tense, but most of your bullets are in ${majority} tense.`,
          fix: "Use present tense only for the job you have now, and past tense for everything else.",
          spans: [[0, firstWord.length]],
        });
      }
    }
  }

  const bullets: BulletReport[] = reports.map((r) => ({ ...r, verdict: verdictFor(r.issues) }));
  const counts: BulletSummary["counts"] = {};
  for (const b of bullets) for (const i of b.issues) counts[i.kind] = (counts[i.kind] ?? 0) + 1;

  return {
    bullets,
    strong: bullets.filter((b) => b.verdict === "strong").length,
    needsWork: bullets.filter((b) => b.verdict === "needs-work").length,
    counts,
  };
}
