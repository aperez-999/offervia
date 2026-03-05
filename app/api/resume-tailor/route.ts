import { NextResponse } from "next/server";
import { z } from "zod";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { resumeTailorSystemPrompt } from "@/lib/prompts/resume-tailor-system";
import { checkFeatureGate } from "@/lib/usage/featureGate";
import { incrementUsage } from "@/lib/usage/increment";
import mammoth from "mammoth";

const resumeTailorJsonSchema = z
  .object({
    resumeText: z.string().max(30000).optional(),
    resumeContent: z.string().max(30000).optional(),
    jobDescription: z.string().max(20000),
    companyName: z.string().max(200).optional(),
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
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5MB for Vercel/serverless

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || "";
}

/**
 * Extract text from PDF using pdf-parse (v1). Safe for Vercel serverless — no rendering, no canvas.
 * Load via wrapper so pdf-parse is never the top-level module (avoids its built-in test that reads ./test/data/*.pdf).
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const pdfParse = (await import("@/lib/pdf-parse-server.cjs")).default;
  const parsed = await pdfParse(buffer);
  const text = (parsed?.text ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return text;
}

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
    return NextResponse.json(
      { error: rl.reason === "unauthorized" ? "UNAUTHORIZED" : "RATE_LIMITED", message: msg },
      { status: rl.reason === "unauthorized" ? 401 : 429, headers: { "Retry-After": String(retry) } }
    );
  }

  const userId = rl.userId!;

  try {
    const gate = await checkFeatureGate(userId, "resume_tailor");
    if (!gate.allowed) {
      return NextResponse.json(
        {
          error: "PLAN_LIMIT_REACHED",
          message: "You've reached your monthly resume tailoring limit. Upgrade to Pro to continue.",
        },
        { status: 403 }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let resumeText = "";
    let jobDescription = "";

    // Company targeting + template flag
    let companyName = "";
    // roleTitle, location, companyUrl removed - not used in current implementation
    let useTemplate = false;

    if (contentType.includes("application/json")) {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return NextResponse.json(
          { error: "INVALID_INPUT", message: "Invalid request." },
          { status: 400 }
        );
      }
      const parsed = resumeTailorJsonSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: "INVALID_INPUT", message: "Invalid request." },
          { status: 400 }
        );
      }
      resumeText = (parsed.data.resumeContent || parsed.data.resumeText || "").toString();
      jobDescription = parsed.data.jobDescription.toString();
      companyName = (parsed.data.companyName || "").toString();
      useTemplate = !!parsed.data.templateMode || parsed.data.template === "1" || !!parsed.data.template;
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      jobDescription = (form.get("jobDescription") as string) || "";
      companyName = ((form.get("companyName") as string) || "").toString();
      useTemplate = ((form.get("template") as string) || "") === "1";

      const providedText = ((form.get("resumeText") as string) || "").toString();
      if (providedText && providedText.trim().length > 0) {
        resumeText = providedText;
      } else {
        const file = form.get("file") as File | null;
        if (file && file.size > 0) {
          if (file.size > MAX_FILE_BYTES) {
            return NextResponse.json(
              {
                error: "INVALID_INPUT",
                message: `File too large. Maximum size is ${MAX_FILE_BYTES / (1024 * 1024)}MB.`,
              },
              { status: 400 }
            );
          }
          const name = (file.name || "").toLowerCase();
          const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
          const isDocx = name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
          if (!isPdf && !isDocx) {
            return NextResponse.json(
              { error: "INVALID_INPUT", message: "Resume file must be PDF or DOCX." },
              { status: 400 }
            );
          }
          const buf = Buffer.from(await file.arrayBuffer());
          if (isDocx) {
            resumeText = await extractFromDocx(buf);
          } else {
            try {
              resumeText = await extractPdfText(buf);
            } catch (err) {
              console.error("PDF parsing failed", err);
              return NextResponse.json(
                {
                  error: "PDF_PARSE_FAILED",
                  message: "Failed to extract text from PDF. Try re-saving the file or use a DOCX.",
                },
                { status: 500 }
              );
            }
          }
          if (!resumeText || resumeText.trim().length < 50) {
            return NextResponse.json(
              {
                error: "INVALID_INPUT",
                message: "Could not extract enough text from the resume. Ensure the file is a valid PDF or DOCX.",
              },
              { status: 400 }
            );
          }
        } else {
          resumeText = (form.get("resumeText") as string) || "";
        }
      }
    }

    // Normalize + lightweight compress
    jobDescription = normalizeText(jobDescription);
    resumeText = normalizeText(resumeText);
    companyName = normalizeText(companyName);
    // roleTitle, location, companyUrl removed - not used in current implementation

    if (!resumeText || resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Invalid request." },
        { status: 400 }
      );
    }

    // Strip obvious sample placeholders but preserve user content
    resumeText = stripSamplePlaceholders(resumeText);

    if (!jobDescription || jobDescription.trim().length < 20) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Invalid request." },
        { status: 400 }
      );
    }
    
    // Debug log in development to verify resume content
    if (process.env.NODE_ENV === "development") {
    }

    // Company context removed - not used in current implementation

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
      return NextResponse.json(
        { error: "SERVER_ERROR", message: "Something went wrong. Try again." },
        { status: 500 }
      );
    }

    await incrementUsage(userId, "resume_tailor");
    return NextResponse.json({ content: normalizeText(cleaned) });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Resume tailoring failed";
    // Surface friendlier error when model context is exceeded
    if (typeof msg === "string" && msg.includes("context_length_exceeded")) {
      return NextResponse.json(
        {
          error: "PAYLOAD_TOO_LARGE",
          message:
            "Your resume and job description are too long for a single pass. Try shortening them and retry.",
        },
        { status: 413 }
      );
    }
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Something went wrong." },
      { status: 500 }
    );
  }
}