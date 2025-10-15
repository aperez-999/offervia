import { NextResponse } from "next/server";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { RESUME_TAILOR_SYSTEM_PROMPT } from "@/lib/resume-tailor-system";
import mammoth from "mammoth";
import { compressResumeLight } from "@/lib/resume-compress-light";

// ---- DOCX Extract ----
async function extractFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || "";
}

// ---- PDF Fallback ----
async function extractFromPdf(buffer: Buffer): Promise<string> {
  let text = buffer.toString("utf8");
  text = text.replace(/\0/g, "").trim();
  return text;
}

export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let resumeText = "";
    let jobDescription = "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      resumeText = (body?.resumeText || "").toString();
      jobDescription = (body?.jobDescription || "").toString();
    } else if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      jobDescription = (form.get("jobDescription") as string) || "";
      const file = form.get("file") as File | null;

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const name = file.name.toLowerCase();

        if (name.endsWith(".docx")) {
          resumeText = await extractFromDocx(buffer);
        } else if (name.endsWith(".pdf")) {
          resumeText = await extractFromPdf(buffer);
        } else {
          resumeText = buffer.toString("utf8");
        }
      }
    }

    // ✅ APPLY LOCAL COMPRESSION BEFORE AI
    resumeText = compressResumeLight(resumeText);

    // FINAL VALIDATION
    if (!jobDescription || jobDescription.trim().length < 20) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }
    if (!resumeText || resumeText.split(/\s+/).length < 100) {
      return NextResponse.json({ error: "Resume is too short to tailor." }, { status: 400 });
    }

    // ---- AI Request ----
    const groq = getGroqClient();
    const messages = [
      { role: "system", content: RESUME_TAILOR_SYSTEM_PROMPT },
      { role: "user", content: `Job Description:\n${jobDescription.slice(0, 8000)}` },
      { role: "user", content: `Resume:\n${resumeText}` },
    ] as const;

    const result = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages: messages as any,
      temperature: 0.2,
      max_tokens: 1600,
    } as any);

    const content = (result as any)?.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ content });

  } catch (err: any) {
    console.error("Resume-tailor API error:", err?.message || err);
    return NextResponse.json({ error: "Resume tailoring failed" }, { status: 500 });
  }
}