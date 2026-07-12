// Client-safe interview config + shared types. No server-only imports here.

export type InterviewFocus = "behavioral" | "technical" | "mixed";
export type InterviewDifficulty = "intro" | "standard" | "senior";

export type AnswerFeedback = {
  score: number; // 0-100
  strengths: string[];
  improvements: string[];
  tip: string;
};

export type TranscriptEntry = AnswerFeedback & {
  question: string;
  answer: string;
};

export type PastInterview = {
  id: string;
  roleTitle: string;
  focus: InterviewFocus;
  difficulty: InterviewDifficulty;
  overallScore: number;
  summary: string;
  transcript: TranscriptEntry[];
  createdAt: string;
};

export const QUESTION_COUNT = 5;

export const FOCUS_OPTIONS: {
  value: InterviewFocus;
  label: string;
  hint: string;
}[] = [
  { value: "behavioral", label: "Behavioral", hint: "Stories, teamwork, conflict, ownership" },
  { value: "technical", label: "Technical", hint: "Role-specific problems and depth" },
  { value: "mixed", label: "Mixed", hint: "A realistic blend of both" },
];

export const DIFFICULTY_OPTIONS: {
  value: InterviewDifficulty;
  label: string;
  hint: string;
}[] = [
  { value: "intro", label: "Intro", hint: "Early-career / new grad" },
  { value: "standard", label: "Standard", hint: "Mid-level expectations" },
  { value: "senior", label: "Senior", hint: "Depth, leadership, trade-offs" },
];

export function focusLabel(focus: string): string {
  return FOCUS_OPTIONS.find((f) => f.value === focus)?.label ?? focus;
}

export function difficultyLabel(difficulty: string): string {
  return DIFFICULTY_OPTIONS.find((d) => d.value === difficulty)?.label ?? difficulty;
}

export function scoreBand(score: number): {
  label: string;
  tone: "reward" | "primary" | "amber" | "muted";
} {
  if (score >= 85) return { label: "Excellent", tone: "reward" };
  if (score >= 70) return { label: "Strong", tone: "primary" };
  if (score >= 50) return { label: "Developing", tone: "amber" };
  return { label: "Needs work", tone: "muted" };
}
