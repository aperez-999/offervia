export type CoverLetterTone = "professional" | "warm" | "confident";

export const COVER_LETTER_TONES: {
  value: CoverLetterTone;
  label: string;
  hint: string;
}[] = [
  { value: "professional", label: "Professional", hint: "Polished and formal" },
  { value: "warm", label: "Warm", hint: "Personable and genuine" },
  { value: "confident", label: "Confident", hint: "Bold and assertive" },
];

const TONE_GUIDANCE: Record<CoverLetterTone, string> = {
  professional:
    "Polished, formal, and businesslike. Respectful and precise, with no slang or filler.",
  warm:
    "Personable, genuine, and human. Show authentic enthusiasm while staying professional.",
  confident:
    "Bold and assertive without arrogance. Lead with impact and clear value.",
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
    `You are an expert career writer who crafts compelling, tailored cover letters.`,
    ``,
    `Write a cover letter for the ${roleTitle || "target role"}${
      companyName ? ` at ${companyName}` : ""
    }.`,
    ``,
    `## Tone`,
    TONE_GUIDANCE[tone],
    ``,
    `## Rules`,
    `1. Use ONLY facts from the candidate's resume and profile — never invent employers, titles, dates, or metrics.`,
    `2. Open with a specific, engaging hook — never "I am writing to apply for...".`,
    `3. Connect the candidate's real strengths to the job's actual requirements.`,
    `4. Keep it 3-4 tight paragraphs, roughly 250-350 words.`,
    `5. Sound like a real person, not a template. No clichés like "team player" or "detail-oriented" unless backed by evidence.`,
    `6. Output plain text only — no markdown, no code blocks, no placeholders like [Your Name] or [Company].`,
    `7. If the candidate's name is present in the resume, sign off with it; otherwise end with a clean closing line and no bracketed placeholder.`,
    `8. Do not fabricate contact details, addresses, or dates.`,
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
