import { NextResponse } from "next/server";
import { z } from "zod";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { resumeTailorSystemPrompt } from "@/lib/prompts/resume-tailor-system";
import { checkFeatureGate } from "@/lib/usage/featureGate";
import { incrementUsage } from "@/lib/usage/increment";
import { fail } from "@/lib/api/response";
import { captureServerException } from "@/lib/monitoring/sentry";
import { saveDocument } from "@/lib/documents/save";
import { extractResumeFile } from "@/lib/files/extract";

const resumeTailorJsonSchema = z
  .object({
    resumeText: z.string().max(30000).optional(),
    resumeContent: z.string().max(30000).optional(),
    jobDescription: z.string().max(20000),
    companyName: z.string().max(200).optional(),
    roleTitle: z.string().max(200).optional(),
    location: z.string().max(200).optional(),
    companyUrl: z.string().max(500).optional(),
    templateMode: z.boolean().optional(),
    template: z.union([z.string(), z.literal("1")]).optional(),
  })
  .strict()
  .refine((d) => (d.resumeText?.length ?? 0) > 0 || (d.resumeContent?.length ?? 0) > 0, {
    message: "resume required",
  });

/* ---------------- Helpers ---------------- */
function normalizeText(s: string) {
  return (s || "")
    .replace(/\r\n/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\t/g, "  ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
function stripSamplePlaceholders(s: string) {
  // Remove very common sample placeholders conservatively
  return (s || "")
    .replace(/\bYOUR NAME\b/gi, "")
    .replace(/\bNAME LASTNAME\b/gi, "")
    .replace(/\bXYZ CORPORATION\b/gi, "")
    .replace(/\bABC STARTUPS?\b/gi, "")
    .replace(/\bACME CORP(ORATION)?\b/gi, "")
    .replace(/\bJOHN DOE\b/gi, "")
    .trim();
}
// Markdown/placeholder sanitization
function sanitizeOutput(s: string, companyName: string) {
  const company = (companyName || "").trim();
  let out = (s || "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/\*\*(.*?)\*\*/g, "$1") // bold
    .replace(/\*(.*?)\*/g, "$1") // italics
    .replace(/^#{1,6}\s+/gm, "") // headers
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // links
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/<\/?RESUME_CHUNK>/g, "") // remove chunk markers
    .replace(/=====\s*BEGIN TEMPLATE\s*=====|=====\s*END TEMPLATE\s*=====/g, "")
    .replace(/NAME\s+LASTNAME/gi, "")
    .trim();

  // Replace common fake company placeholders with the real target company if provided
  if (company) {
    out = out
      .replace(/\bXYZ\s+CORPORATION\b/gi, company)
      .replace(/\bXYZ\s+CORP\b/gi, company)
      .replace(/\bACME\s+CORP(ORATION)?\b/gi, company);
  }
  // Remove obvious generic placeholders that should never appear
  out = out
    .replace(/\bYOUR NAME\b/gi, "")
    .replace(/\b[\[{(]?add achievement[^\n]*[\]})]?/gi, "")
    .replace(/\s+\n/g, "\n")
    .trim();
  return out;
}

/* ---------------- File extractors (serverless-safe: text-only, no canvas/DOMMatrix) ---------------- */
/* ---------------- Route ---------------- */
export async function POST(req: Request) {
  // ---- Rate limit (resume-tailor) ----
  const { checkRateLimitForApi } = await import("@/lib/rate-limit");
  const rl = await checkRateLimitForApi(req, "resume_tailor", {
    perMinute: 4,
    perDay: 75,
  });

  if (!rl.ok) {
    const retry = rl.retryAfterSeconds || 60;
    const msg =
      rl.reason === "unauthorized"
        ? "Authentication required."
        : "Too many requests. Try again soon.";
    return fail(rl.reason === "unauthorized" ? "UNAUTHORIZED" : "RATE_LIMITED", msg, rl.reason === "unauthorized" ? 401 : 429, {
      headers: { "Retry-After": String(retry) },
    });
  }

  const userId = rl.userId!;

  try {
    const gate = await checkFeatureGate(userId, "resume_tailor");
    if (!gate.allowed) {
      return fail(
        "PLAN_LIMIT_REACHED",
        "You've reached your monthly resume tailoring limit. Upgrade to Pro to continue.",
        403
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let resumeText = "";
    let jobDescription = "";

    // Company targeting + template flag
    let companyName = "";
    let roleTitle = "";
    let location = "";
    let companyUrl = "";
    let useTemplate = false;

    if (contentType.includes("application/json")) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return fail("INVALID_INPUT", "Invalid request.", 400);
      }
      const parsed = resumeTailorJsonSchema.safeParse(body);
      if (!parsed.success) {
        return fail("INVALID_INPUT", "Invalid request.", 400);
      }
      resumeText = (parsed.data.resumeContent || parsed.data.resumeText || "").toString();
      jobDescription = parsed.data.jobDescription.toString();
      companyName = (parsed.data.companyName || "").toString();
      roleTitle = (parsed.data.roleTitle || "").toString();
      location = (parsed.data.location || "").toString();
      companyUrl = (parsed.data.companyUrl || "").toString();
      useTemplate = !!parsed.data.templateMode || parsed.data.template === "1" || !!parsed.data.template;
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      jobDescription = (form.get("jobDescription") as string) || "";
      companyName = ((form.get("companyName") as string) || "").toString();
      roleTitle = ((form.get("roleTitle") as string) || "").toString();
      location = ((form.get("location") as string) || "").toString();
      companyUrl = ((form.get("companyUrl") as string) || "").toString();
      useTemplate = ((form.get("template") as string) || "") === "1";

      const providedText = ((form.get("resumeText") as string) || "").toString();
      if (providedText && providedText.trim().length > 0) {
        resumeText = providedText;
      } else {
        const file = form.get("file") as File | null;
        if (file && file.size > 0) {
          const extracted = await extractResumeFile(file, "api/resume-tailor");
          if (!extracted.ok) {
            return fail(
              extracted.status === 500 ? "SERVER_ERROR" : "INVALID_INPUT",
              extracted.message,
              extracted.status,
            );
          }
          resumeText = extracted.text;
        } else {
          resumeText = (form.get("resumeText") as string) || "";
        }
      }
    }

    // Normalize + lightweight compress
    jobDescription = normalizeText(jobDescription);
    resumeText = normalizeText(resumeText);
    companyName = normalizeText(companyName);
    roleTitle = normalizeText(roleTitle);
    location = normalizeText(location);
    companyUrl = normalizeText(companyUrl);

    if (!resumeText || resumeText.trim().length < 100) {
      return fail("INVALID_INPUT", "Invalid request.", 400);
    }

    // Strip obvious sample placeholders but preserve user content
    resumeText = stripSamplePlaceholders(resumeText);

    if (!jobDescription || jobDescription.trim().length < 20) {
      return fail("INVALID_INPUT", "Invalid request.", 400);
    }

    // Size budgets (keep payload within free-tier context/TPM limits)
    const JD_MAX_CHARS = 1000;
    const RESUME_MAX_CHARS = 4500;
    const MAX_COMBINED_CHARS = 9000; // JD + resume combined hard cap
    if (jobDescription.length > JD_MAX_CHARS) {
      const prefer = /(?:requirements|responsibilities|what you'll do|what you bring)[:\s]/i;
      const match = jobDescription.match(prefer);
      if (match) {
        const start = Math.max(0, match.index! - 400);
        jobDescription = jobDescription.slice(start, start + JD_MAX_CHARS);
      } else {
        jobDescription = jobDescription.slice(0, JD_MAX_CHARS);
      }
    }
    if (resumeText.length > RESUME_MAX_CHARS) {
      // Keep the first portion which usually contains header/summary + recent experience
      resumeText = resumeText.slice(0, RESUME_MAX_CHARS);
    }

    // Enforce combined budget (prioritize keeping JD intact once capped)
    if (resumeText.length + jobDescription.length > MAX_COMBINED_CHARS) {
      const remaining = Math.max(1000, MAX_COMBINED_CHARS - jobDescription.length);
      resumeText = resumeText.slice(0, remaining);
    }
    const groq = getGroqClient();

    const systemMessage = resumeTailorSystemPrompt(
      companyName,
      roleTitle,
      location,
      companyUrl,
      resumeText,
      jobDescription,
      useTemplate
    );

    const completion = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      temperature: 0.6,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: "Please rewrite the full resume based on the content above. Use all factual details and keep it complete.",
        },
      ],
    });

    let aiText = completion.choices?.[0]?.message?.content || "";
    // Enhanced sanitization
    aiText = aiText
      .replace(/%PDF-[\s\S]*/g, "")          // remove binary PDF junk
      .replace(/```[\s\S]*?```/g, "")       // remove code fences
      .replace(/<[^>]+>/g, "")                // remove HTML
      .replace(/\[[^\]]+\]/g, "")          // remove [insert placeholders]
      .replace(/NAME\s+LASTNAME/gi, "")      // clean test placeholders
      .trim();

    const cleaned = sanitizeOutput(aiText, companyName);

    if (cleaned.length < 100) {
      return fail("SERVER_ERROR", "Something went wrong. Try again.", 500);
    }

    await incrementUsage(userId, "resume_tailor");

    const tailored = normalizeText(cleaned);
    const docTitle =
      [roleTitle, companyName].filter(Boolean).join(" · ") || "Tailored resume";
    await saveDocument({
      userId,
      kind: "resume",
      title: docTitle,
      content: tailored,
      meta: { company: companyName, role: roleTitle },
    });

    return NextResponse.json({ content: tailored });
  } catch (err: unknown) {
    captureServerException(err, { route: "api/resume-tailor" });
    const msg = err instanceof Error ? err.message : "Resume tailoring failed";
    // Surface friendlier error when model context is exceeded
    if (typeof msg === "string" && msg.includes("context_length_exceeded")) {
      return fail(
        "INVALID_INPUT",
        "Your resume and job description are too long for a single pass. Try shortening them and retry.",
        413
      );
    }
    return fail("SERVER_ERROR", "Something went wrong.", 500);
  }
}
