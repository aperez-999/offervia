import mammoth from "mammoth";
import { captureServerException } from "@/lib/monitoring/sentry";

// 5MB — safe ceiling for Vercel/serverless request bodies.
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export type ExtractResult =
  | { ok: true; text: string }
  | { ok: false; message: string; status: number };

async function extractFromDocx(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.extractRawText({ buffer });
  return value || "";
}

/**
 * Extract text from PDF using pdf-parse (v1). Safe for Vercel serverless — no
 * rendering, no canvas. Loaded via wrapper so pdf-parse is never the top-level
 * module (avoids its built-in test that reads ./test/data/*.pdf).
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

/**
 * Validate and extract text from an uploaded resume file (PDF or DOCX).
 * Returns a discriminated result so callers can surface a friendly error
 * without leaking internals. Used by resume-tailor and cover-letter routes.
 */
export async function extractResumeFile(
  file: File,
  route: string,
): Promise<ExtractResult> {
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      message: `That file is too large. Upload a PDF or DOCX under ${MAX_FILE_BYTES / (1024 * 1024)} MB.`,
      status: 400,
    };
  }

  const name = (file.name || "").toLowerCase();
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
  const isDocx =
    name.endsWith(".docx") ||
    file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  if (!isPdf && !isDocx) {
    return { ok: false, message: "Upload your resume as a PDF or DOCX.", status: 400 };
  }

  const buf = Buffer.from(await file.arrayBuffer());
  let text = "";

  if (isDocx) {
    text = await extractFromDocx(buf);
  } else {
    try {
      text = await extractPdfText(buf);
    } catch (err) {
      captureServerException(err, { route, extras: { stage: "pdf-parse" } });
      console.error("PDF parsing failed", err);
      return {
        ok: false,
        message:
          "Couldn't read text from that PDF. Export it again and retry, or upload a DOCX.",
        status: 500,
      };
    }
  }

  if (!text || text.trim().length < 50) {
    return {
      ok: false,
      message:
        "Couldn't find enough text in that file. If it's a scanned image, upload a text-based PDF or a DOCX.",
      status: 400,
    };
  }

  return { ok: true, text };
}
