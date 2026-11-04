export type CoverLetterTone = "professional" | "warm" | "confident";

export const COVER_LETTER_TONES: {
  value: CoverLetterTone;
  label: string;
  hint: string;
}[] = [
  { value: "professional", label: "Professional", hint: "Formal and precise" },
  { value: "warm", label: "Warm", hint: "Friendly and personal" },
  { value: "confident", label: "Confident", hint: "Direct, leads with results" },
];

const TONE_GUIDANCE: Record<CoverLetterTone, string> = {
  professional:
    "Polished, formal, and businesslike. Respectful and precise, with no slang or filler.",
  warm:
    "Personable and human. Show interest through specific reasons the role appeals, not exclamations or gushing.",
  confident:
    "Direct and assertive without arrogance. Lead with the candidate's most relevant real result.",
};

export function coverLetterSystemPrompt(input: {
  companyName: string;
  roleTitle: string;
  tone: CoverLetterTone;
  resumeContent: string;
  jobDescription: string;
  profileContext?: string;
}): string {
  const { companyName, roleTitle, tone, resumeContent, jobDescription, profileContext } =
    input;

  return [
    `You are an experienced career writer who writes specific, believable cover letters.`,
    ``,
    `Write a cover letter for the ${roleTitle || "target role"}${
      companyName ? ` at ${companyName}` : ""
    }.`,
    ``,
    `## Tone`,
    TONE_GUIDANCE[tone],
    ``,
    `## Rules`,
    `1. Use ONLY facts from the candidate's resume and profile. Never invent employers, titles, dates, or metrics.`,
    `2. Open with something specific about this role or company (a product, a problem named in the job description, or a requirement that matches the candidate's real work). Never use a stock opener such as "I am writing to apply for...", "I am writing to express my interest", "I am excited to apply", or "In today's fast-paced...".`,
    `3. Connect the candidate's real strengths to the job's actual requirements.`,
    `4. Keep it 3-4 tight paragraphs, roughly 250-350 words.`,
    `5. Sound like a real person, not a template. No clichés like "team player" or "detail-oriented" unless backed by evidence.`,
    `6. Output plain text only: no markdown, no code blocks, no placeholders like [Your Name] or [Company].`,
    `7. If the candidate's name is present in the resume, sign off with it; otherwise end with a clean closing line and no bracketed placeholder.`,
    `8. Do not fabricate contact details, addresses, or dates.`,
    ``,
    `## Writing style`,
    `- Write like a real person talking to a hiring manager. Short sentences, plain words.`,
    `- Do not use em dashes. Use commas, periods, colons, or parentheses instead.`,
    `- Do not use these words or phrases: leverage, spearheaded, utilize, passionate, thrilled, excited to apply, dynamic, results-driven, synergy, seamless, robust, cutting-edge.`,
    `- Prefer concrete specifics (what the candidate built, fixed, or ran, and for whom) over adjectives.`,
    `- Use plain verbs: led, built, cut, shipped, ran, wrote.`,
    `- Never invent numbers. Only cite metrics the candidate provided.`,
    `- No lists of three adjectives or three-part slogans. No generic closing lines about "the opportunity to contribute".`,
    profileContext ? `\n## Candidate profile\n${profileContext}` : ``,
    ``,
    `## Candidate resume`,
    resumeContent,
    ``,
    `## Job description`,
    jobDescription,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}
