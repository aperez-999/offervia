import { z } from "zod";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { ATS_KEYWORDS_SYSTEM_PROMPT } from "@/lib/ats/prompts";
import { coerceKeywords, scoreAts } from "@/lib/ats/utils";
import { extractResumeFile } from "@/lib/files/extract";
import { fail } from "@/lib/api/response";
import { captureServerException } from "@/lib/monitoring/sentry";

const jsonSchema = z
  .object({
    resumeText: z.string().min(1).max(30000),
    jd: z.string().min(20).max(20000),
  })
  .strict();

export async function POST(req: Request) {
  const { checkRateLimitForApi } = await import("@/lib/rate-limit");
  const rl = await checkRateLimitForApi(req, "scanner", {
    perMinute: 6,
    perDay: 150,
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

  try {
    let resumeText = "";
    let jd = "";

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      jd = ((form.get("jd") as string) || "").slice(0, 20000);
      const pasted = ((form.get("resumeText") as string) || "").slice(0, 30000);
      const file = form.get("file") as File | null;
      if (file && file.size > 0) {
        const extracted = await extractResumeFile(file, "api/ats-scan");
        if (!extracted.ok) {
          return fail(
            extracted.status === 500 ? "SERVER_ERROR" : "INVALID_INPUT",
            extracted.message,
            extracted.status,
          );
        }
        resumeText = extracted.text;
      } else {
        resumeText = pasted;
      }
    } else {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
      }
      const parsed = jsonSchema.safeParse(body);
      if (!parsed.success) {
        return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
      }
      resumeText = parsed.data.resumeText;
      jd = parsed.data.jd;
    }

    resumeText = resumeText.trim();
    jd = jd.trim();

    if (resumeText.length < 50) {
      return fail(
        "INVALID_INPUT",
        "Add at least 50 characters of your resume to compare.",
        400,
      );
    }
    if (jd.length < 20) {
      return fail("INVALID_INPUT", "Add a job description to scan against.", 400);
    }

    const groq = getGroqClient();
    const result = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages: [
        { role: "system", content: ATS_KEYWORDS_SYSTEM_PROMPT },
        { role: "user", content: jd.slice(0, 20000) },
      ],
      temperature: 0.1,
      max_tokens: 800,
    });

    const raw =
      (result?.choices?.[0]?.message?.content as string | undefined)?.trim() || "";

    let aiParsed: { role_title?: unknown; keywords?: unknown };
    try {
      const stripped = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
      aiParsed = JSON.parse(stripped);
    } catch {
      return fail("SERVER_ERROR", "The scan didn't finish. Try again.", 500);
    }

    const keywords = coerceKeywords(aiParsed.keywords);
    if (keywords.length === 0) {
      return fail(
        "SERVER_ERROR",
        "Couldn't read keywords from that job description. Try a fuller description.",
        500,
      );
    }

    const roleTitle =
      typeof aiParsed.role_title === "string" ? aiParsed.role_title.trim() : "";

    const content = scoreAts(resumeText, keywords, roleTitle);
    return Response.json({ content });
  } catch (error) {
    captureServerException(error, { route: "api/ats-scan" });
    return fail("SERVER_ERROR", "The scan didn't finish. Try again.", 500);
  }
}
