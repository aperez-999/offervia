import { NextResponse } from "next/server";
import { z } from "zod";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import {
  coverLetterSystemPrompt,
  type CoverLetterTone,
} from "@/lib/prompts/cover-letter-system";
import { checkFeatureGate } from "@/lib/usage/featureGate";
import { incrementUsage } from "@/lib/usage/increment";
import { getServiceSupabase } from "@/lib/supabase/service";
import { readCareerProfile } from "@/lib/profile/read";
import { buildProfileContext } from "@/lib/profile/career";
import { fail } from "@/lib/api/response";
import { captureServerException } from "@/lib/monitoring/sentry";
import { saveDocument } from "@/lib/documents/save";
import { extractResumeFile } from "@/lib/files/extract";

const coverLetterSchema = z
  .object({
    resumeText: z.string().max(30000),
    jobDescription: z.string().max(20000),
    companyName: z.string().max(200).optional(),
    roleTitle: z.string().max(200).optional(),
    tone: z.enum(["professional", "warm", "confident"]).optional(),
  })
  .strict();

function normalizeText(s: string) {
  return (s || "")
    .replace(/\r\n/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\t/g, "  ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sanitizeOutput(s: string) {
  return (s || "")
    .replace(/%PDF-[\s\S]*/g, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[[^\]]*your name[^\]]*\]/gi, "")
    .replace(/\[[^\]]*company[^\]]*\]/gi, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(req: Request) {
  const { checkRateLimitForApi } = await import("@/lib/rate-limit");
  const rl = await checkRateLimitForApi(req, "cover_letter", {
    perMinute: 4,
    perDay: 60,
  });

  if (!rl.ok) {
    const retry = rl.retryAfterSeconds || 60;
    const msg =
      rl.reason === "unauthorized"
        ? "Sign in to continue."
        : "Too many requests. Wait a minute and try again.";
    return fail(
      rl.reason === "unauthorized" ? "UNAUTHORIZED" : "RATE_LIMITED",
      msg,
      rl.reason === "unauthorized" ? 401 : 429,
      { headers: { "Retry-After": String(retry) } },
    );
  }

  const userId = rl.userId!;

  try {
    const gate = await checkFeatureGate(userId, "cover_letter");
    if (!gate.allowed) {
      return fail(
        "PLAN_LIMIT_REACHED",
        "You've used this month's cover letters. Upgrade to Pro for more.",
        403,
      );
    }

    const contentType = req.headers.get("content-type") || "";
    let resumeTextRaw = "";
    let jobDescriptionRaw = "";
    let companyNameRaw = "";
    let roleTitleRaw = "";
    let tone: CoverLetterTone = "professional";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      jobDescriptionRaw = ((form.get("jobDescription") as string) || "").slice(0, 20000);
      companyNameRaw = ((form.get("companyName") as string) || "").slice(0, 200);
      roleTitleRaw = ((form.get("roleTitle") as string) || "").slice(0, 200);
      const toneVal = (form.get("tone") as string) || "professional";
      if (toneVal === "warm" || toneVal === "confident") tone = toneVal;

      const pastedResume = ((form.get("resumeText") as string) || "").slice(0, 30000);
      const file = form.get("file") as File | null;
      if (file && file.size > 0) {
        const extracted = await extractResumeFile(file, "api/cover-letter");
        if (!extracted.ok) {
          return fail(
            extracted.status === 500 ? "SERVER_ERROR" : "INVALID_INPUT",
            extracted.message,
            extracted.status,
          );
        }
        resumeTextRaw = extracted.text;
      } else {
        resumeTextRaw = pastedResume;
      }
    } else {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
      }

      const parsed = coverLetterSchema.safeParse(body);
      if (!parsed.success) {
        return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
      }
      resumeTextRaw = parsed.data.resumeText;
      jobDescriptionRaw = parsed.data.jobDescription;
      companyNameRaw = parsed.data.companyName || "";
      roleTitleRaw = parsed.data.roleTitle || "";
      tone = parsed.data.tone || "professional";
    }

    let resumeText = normalizeText(resumeTextRaw);
    let jobDescription = normalizeText(jobDescriptionRaw);
    const companyName = normalizeText(companyNameRaw);
    const roleTitle = normalizeText(roleTitleRaw);

    if (resumeText.length < 100) {
      return fail("INVALID_INPUT", "Add more of your resume so the letter has real details to draw on.", 400);
    }
    if (jobDescription.length < 20) {
      return fail("INVALID_INPUT", "Add the job description so the letter can address the role.", 400);
    }

    // Keep payload within free-tier context/TPM limits.
    const JD_MAX = 1200;
    const RESUME_MAX = 4500;
    if (jobDescription.length > JD_MAX) jobDescription = jobDescription.slice(0, JD_MAX);
    if (resumeText.length > RESUME_MAX) resumeText = resumeText.slice(0, RESUME_MAX);

    const supabase = getServiceSupabase();
    const profileContext = buildProfileContext(await readCareerProfile(supabase, userId));

    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      temperature: 0.7,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: coverLetterSystemPrompt({
            companyName,
            roleTitle,
            tone,
            resumeContent: resumeText,
            jobDescription,
            profileContext: profileContext || undefined,
          }),
        },
        {
          role: "user",
          content: "Write the cover letter now, following every rule above.",
        },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const cleaned = sanitizeOutput(raw);

    if (cleaned.length < 100) {
      return fail("SERVER_ERROR", "Couldn't write the letter. Try again in a moment.", 500);
    }

    await incrementUsage(userId, "cover_letter");

    const docTitle =
      [companyName, roleTitle].filter(Boolean).join(" · ") || "Cover letter";
    await saveDocument({
      userId,
      kind: "cover_letter",
      title: docTitle,
      content: cleaned,
      meta: { tone, company: companyName, role: roleTitle },
    });

    return NextResponse.json({ content: cleaned, tone });
  } catch (err: unknown) {
    captureServerException(err, { route: "api/cover-letter" });
    const msg = err instanceof Error ? err.message : "Cover letter generation failed";
    if (typeof msg === "string" && msg.includes("context_length_exceeded")) {
      return fail(
        "INVALID_INPUT",
        "Your resume and job description are too long to process together. Shorten one of them and try again.",
        413,
      );
    }
    return fail("SERVER_ERROR", "Couldn't write the letter. Try again in a moment.", 500);
  }
}
