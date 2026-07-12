import type { InterviewDifficulty, InterviewFocus, TranscriptEntry } from "./config";

const DIFFICULTY_GUIDANCE: Record<InterviewDifficulty, string> = {
  intro:
    "Target an early-career or new-grad candidate. Keep questions approachable and foundational.",
  standard:
    "Target a mid-level candidate with a few years of experience. Expect concrete examples and reasoning.",
  senior:
    "Target a senior candidate. Probe depth, trade-offs, leadership, ambiguity, and impact at scale.",
};

const FOCUS_GUIDANCE: Record<InterviewFocus, string> = {
  behavioral:
    "Ask behavioral questions about ownership, collaboration, conflict, failure, and impact. Encourage STAR-style answers.",
  technical:
    "Ask role-specific technical questions that test practical depth and problem-solving for this exact role.",
  mixed:
    "Blend behavioral and technical questions the way a realistic first-round interview would.",
};

export function buildQuestionSystemPrompt(): string {
  return [
    "You are a rigorous but fair hiring interviewer for a modern company.",
    "Generate a focused set of interview questions tailored to the role.",
    "Rules: no numbering, no preamble, each question is a single clear sentence.",
    'Respond ONLY as JSON: {"questions": ["...", "..."]}. No markdown, no commentary.',
  ].join(" ");
}

export function buildQuestionUserPrompt(input: {
  roleTitle: string;
  focus: InterviewFocus;
  difficulty: InterviewDifficulty;
  count: number;
  profileContext?: string;
}): string {
  const { roleTitle, focus, difficulty, count, profileContext } = input;
  return [
    `Role: ${roleTitle}`,
    `Difficulty: ${difficulty}. ${DIFFICULTY_GUIDANCE[difficulty]}`,
    `Focus: ${focus}. ${FOCUS_GUIDANCE[focus]}`,
    profileContext ? `\n${profileContext}\n` : "",
    profileContext
      ? "Tailor questions to the candidate's background and skills above where relevant."
      : "",
    `Produce exactly ${count} distinct questions, ordered from warm-up to hardest.`,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildScoreSystemPrompt(): string {
  return [
    "You are an expert interview coach scoring a single candidate answer.",
    "Be honest, specific, and constructive. Reward concrete detail, structure (STAR), and relevance; penalize vagueness and filler.",
    'Respond ONLY as JSON: {"score": <0-100 integer>, "strengths": ["..."], "improvements": ["..."], "tip": "one actionable sentence"}.',
    "Provide 1-3 strengths and 1-3 improvements. No markdown, no commentary outside JSON.",
  ].join(" ");
}

export function buildScoreUserPrompt(input: {
  roleTitle: string;
  focus: InterviewFocus;
  question: string;
  answer: string;
  profileContext?: string;
}): string {
  const { roleTitle, focus, question, answer, profileContext } = input;
  return [
    `Role: ${roleTitle} (focus: ${focus})`,
    profileContext ? `\n${profileContext}\n` : "",
    `Question: ${question}`,
    `Candidate answer: ${answer}`,
    "Score this answer for how well it would land in a real interview.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildSummarySystemPrompt(): string {
  return [
    "You are an interview coach writing a short wrap-up after a mock interview.",
    "Summarize overall performance in 2-4 sentences: what was strong, the single biggest thing to improve, and an encouraging next step.",
    'Respond ONLY as JSON: {"summary": "..."}. No markdown, no commentary outside JSON.',
  ].join(" ");
}

export function buildSummaryUserPrompt(input: {
  roleTitle: string;
  overallScore: number;
  transcript: Pick<TranscriptEntry, "question" | "score" | "improvements">[];
}): string {
  const { roleTitle, overallScore, transcript } = input;
  const lines = transcript
    .map(
      (t, i) =>
        `Q${i + 1} (${t.score}/100): ${t.question} — key gaps: ${
          t.improvements.slice(0, 2).join("; ") || "none noted"
        }`
    )
    .join("\n");
  return [
    `Role: ${roleTitle}`,
    `Overall score: ${overallScore}/100`,
    "Per-question results:",
    lines,
  ].join("\n");
}
