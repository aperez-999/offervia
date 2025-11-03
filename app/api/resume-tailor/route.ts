import { NextResponse } from "next/server";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { resumeTailorSystemPrompt } from "@/lib/prompts/resume-tailor-system";
import mammoth from "mammoth";

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

/* ---------------- File extractors ---------------- */
async function extractFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || "";
}
async function extractFromPdf(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid ESM bundling issues with Next.js
    const { PDFParse } = await import("pdf-parse");
    const pdf = new PDFParse({ data: buffer });
    try {
      const textResult = await pdf.getText();
      // Normalize spacing and remove excessive newlines
      const text = (textResult.text || "")
        .replace(/\r\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      await pdf.destroy();
      return text;
    } catch (err) {
      console.error("PDF extraction failed:", err);
      await pdf.destroy().catch(() => {});
      return "";
    }
  } catch (err) {
    console.error("Failed to load pdf-parse module:", err);
    return "";
  }
}

/* ---------------- Route ---------------- */
export async function POST(req: Request) {
  // ---- Rate limit (resume-tailor) ----
  try {
    const mod = await import("@/lib/rate-limit");
    const enforceRateLimit = (mod as any).enforceRateLimit as
      | ((kind: string, req: Request, limits: any) => Promise<any>)
      | undefined;

    if (enforceRateLimit) {
      const rl = await enforceRateLimit("resume-tailor", req, {
        perMinute: 4,
        perDay: 75,
      });
      const limited =
        rl && (rl.ok === false || rl.allowed === false || rl.limitReached === true);
      if (limited) {
        const retry =
          typeof rl?.retryAfter === "number" ? rl.retryAfter : 60;
        return NextResponse.json(
          { error: "Rate limit reached. Please try again soon." },
          { status: 429, headers: { "Retry-After": String(retry) } }
        );
      }
    }
  } catch {
    // no-op
  }

  try {
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
      const body = await req.json();
      // Accept both resumeText and resumeContent keys
      resumeText = (body?.resumeContent || body?.resumeText || "").toString();
      jobDescription = (body?.jobDescription || "").toString();
      companyName = (body?.companyName || "").toString();
      roleTitle = (body?.roleTitle || "").toString();
      location = (body?.location || "").toString();
      companyUrl = (body?.companyUrl || "").toString();
      useTemplate = !!body?.templateMode || !!body?.template || body?.template === "1";
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      jobDescription = (form.get("jobDescription") as string) || "";
      companyName = ((form.get("companyName") as string) || "").toString();
      roleTitle = ((form.get("roleTitle") as string) || "").toString();
      location = ((form.get("location") as string) || "").toString();
      companyUrl = ((form.get("companyUrl") as string) || "").toString();
      useTemplate = ((form.get("template") as string) || "") === "1";

      // Prefer resumeText if provided; otherwise try the file
      const providedText = ((form.get("resumeText") as string) || "").toString();
      if (providedText && providedText.trim().length > 0) {
        resumeText = providedText;
      } else {
        const file = form.get("file") as File | null;
        if (file) {
          const buf = Buffer.from(await file.arrayBuffer());
          const name = (file.name || "").toLowerCase();
          if (name.endsWith(".docx")) resumeText = await extractFromDocx(buf);
          else if (name.endsWith(".pdf")) resumeText = await extractFromPdf(buf);
          else resumeText = buf.toString("utf8");
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

    // Validation: ensure we have valid resume content
    if (!resumeText || resumeText.trim().length < 100) {
      return NextResponse.json(
        { error: "No valid resume text received. Please re-upload your resume." },
        { status: 400 }
      );
    }

    // Strip obvious sample placeholders but preserve user content
    resumeText = stripSamplePlaceholders(resumeText);

    if (!jobDescription || jobDescription.trim().length < 20) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }
    
    // Debug log in development to verify resume content
    if (process.env.NODE_ENV === "development") {
      console.log("Resume content received (first 200 chars):", resumeText.slice(0, 200));
    }

    // Optional company context block
    const companyParts: string[] = [];
    if (companyName) companyParts.push(`Company: ${companyName}`);
    if (roleTitle) companyParts.push(`Role focus: ${roleTitle}`);
    if (location) companyParts.push(`Location: ${location}`);
    if (companyUrl) companyParts.push(`Reference URL: ${companyUrl}`);
    const companyContext = companyParts.length ? `Company targeting context:\n${companyParts.join("\n")}` : "";

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
        { error: "Model returned incomplete or invalid content. Try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ content: normalizeText(cleaned) });
  } catch (err: any) {
    const msg = err?.message || "Resume tailoring failed";
    // Surface friendlier error when model context is exceeded
    if (typeof msg === "string" && msg.includes("context_length_exceeded")) {
      console.error("Resume-tailor API error: input too large");
      return NextResponse.json(
        { error: "Your resume and job description are too long for a single pass. Try shortening them and retry." },
        { status: 413 }
      );
    }
    console.error("Resume-tailor API error:", msg);
    return NextResponse.json({ error: "Resume tailoring failed" }, { status: 500 });
  }
}