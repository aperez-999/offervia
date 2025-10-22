import { NextResponse } from "next/server";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import {
  RESUME_TAILOR_SYSTEM_PROMPT,
  RESUME_TAILOR_TEMPLATE_PROMPT,
} from "@/lib/resume-tailor-system";
import mammoth from "mammoth";
import { compressResumeLight } from "@/lib/resume-compress-light";

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
function approxTokens(s: string) {
  return Math.max(1, Math.round((s || "").length / 4));
}
function chunkTextByParagraphs(text: string, targetMaxChars = 2600, hardMaxChars = 3000) {
  const paras = text.split(/\n{2,}/g).map((p) => p.trim()).filter(Boolean);
  const chunks: string[] = [];
  let current = "";
  const pushCurrent = () => {
    if (!current.trim()) return;
    if (current.length > hardMaxChars) {
      for (let i = 0; i < current.length; i += hardMaxChars) {
        chunks.push(current.slice(i, i + hardMaxChars));
      }
    } else {
      chunks.push(current);
    }
    current = "";
  };
  for (const p of paras) {
    if (!current) { current = p; continue; }
    if ((current + "\n\n" + p).length <= targetMaxChars) current += "\n\n" + p;
    else { pushCurrent(); current = p; }
  }
  pushCurrent();
  return chunks.length ? chunks : [text];
}

/* ---------------- File extractors ---------------- */
async function extractFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || "";
}
async function extractFromPdf(buffer: Buffer): Promise<string> {
  let text = buffer.toString("utf8");
  return text.replace(/\0/g, "").trim();
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
      resumeText = (body?.resumeText || "").toString();
      jobDescription = (body?.jobDescription || "").toString();
      companyName = (body?.companyName || "").toString();
      roleTitle = (body?.roleTitle || "").toString();
      location = (body?.location || "").toString();
      companyUrl = (body?.companyUrl || "").toString();
      useTemplate = !!body?.template || body?.template === "1";
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      jobDescription = (form.get("jobDescription") as string) || "";
      companyName = ((form.get("companyName") as string) || "").toString();
      roleTitle = ((form.get("roleTitle") as string) || "").toString();
      location = ((form.get("location") as string) || "").toString();
      companyUrl = ((form.get("companyUrl") as string) || "").toString();
      useTemplate = ((form.get("template") as string) || "") === "1";

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

    // Normalize + lightweight compress
    jobDescription = normalizeText(jobDescription);
    resumeText = normalizeText(resumeText);
    companyName = normalizeText(companyName);
    roleTitle = normalizeText(roleTitle);
    location = normalizeText(location);
    companyUrl = normalizeText(companyUrl);

    resumeText = compressResumeLight(resumeText);

    if (!jobDescription || jobDescription.trim().length < 20) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }
    if (!resumeText || resumeText.split(/\s+/).length < 50) {
      return NextResponse.json({ error: "Resume is too short to tailor." }, { status: 400 });
    }

    // Optional company context block
    const companyParts: string[] = [];
    if (companyName) companyParts.push(`Company: ${companyName}`);
    if (roleTitle) companyParts.push(`Role focus: ${roleTitle}`);
    if (location) companyParts.push(`Location: ${location}`);
    if (companyUrl) companyParts.push(`Reference URL: ${companyUrl}`);
    const companyContext = companyParts.length ? `Company targeting context:\n${companyParts.join("\n")}` : "";

    // Size budgets
    const JD_MAX_CHARS = 2400;
    const RESUME_CHUNK_TARGET = 2600;
    const RESUME_CHUNK_HARD = 3000;

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

    const resumeChunks = chunkTextByParagraphs(resumeText, RESUME_CHUNK_TARGET, RESUME_CHUNK_HARD);
    const singleCallPossible =
      approxTokens(companyContext) + approxTokens(jobDescription) + approxTokens(resumeText) < 1400;

    const groq = getGroqClient();
    const systemPrompt = useTemplate
      ? RESUME_TAILOR_TEMPLATE_PROMPT
      : RESUME_TAILOR_SYSTEM_PROMPT;

    async function callModel(companyCtx: string, jd: string, partialResume: string) {
      const messages = [
        { role: "system", content: systemPrompt },
        ...(companyCtx ? [{ role: "user", content: companyCtx }] as const : []),
        { role: "user", content: `Here is the job description (truncated to fit model limits):\n\n${jd}` },
        {
          role: "user",
          content:
            `Here is a portion of the resume between <RESUME_CHUNK> tags.\n` +
            `Tailor ONLY this portion to the job description (and the company context, if provided). ` +
            `Keep structure and bullet style appropriate for ATS, improve impact, and align keywords. ` +
            `Return JUST the rewritten text for this chunk—no commentary.\n\n` +
            `<RESUME_CHUNK>\n${partialResume}\n</RESUME_CHUNK>`,
        },
      ] as const;

      const result = await groq.chat.completions.create({
        model: DEFAULT_GROQ_MODEL,
        messages: messages as any,
        temperature: 0.2,
        max_tokens: 1600,
      } as any);

      return (result as any)?.choices?.[0]?.message?.content?.trim() || "";
    }

    let finalOutput = "";
    if (singleCallPossible) {
      finalOutput = await callModel(companyContext, jobDescription, resumeText);
    } else {
      const outputs: string[] = [];
      for (const chunk of resumeChunks) {
        const tailored = await callModel(companyContext, jobDescription, chunk);
        outputs.push(tailored || chunk);
      }
      finalOutput = outputs.join("\n\n");
    }

    return NextResponse.json({ content: normalizeText(finalOutput) });
  } catch (err: any) {
    console.error("Resume-tailor API error:", err?.message || err);
    return NextResponse.json({ error: "Resume tailoring failed" }, { status: 500 });
  }
}