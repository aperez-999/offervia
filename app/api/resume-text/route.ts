import { fail } from "@/lib/api/response";
import { extractResumeFile } from "@/lib/files/extract";
import { normalizeResumeText } from "@/lib/profile/resume";
import { captureServerException } from "@/lib/monitoring/sentry";

/**
 * Turns an uploaded PDF or DOCX into plain text for My resume. It doesn't
 * store anything: the browser saves the text to the profile under row-level
 * security, the same way the other profile fields are saved.
 */
export async function POST(req: Request) {
  const { checkRateLimitForApi } = await import("@/lib/rate-limit");
  const rl = await checkRateLimitForApi(req, "resume_text", { perMinute: 6, perDay: 60 });
  if (!rl.ok) {
    const unauthorized = rl.reason === "unauthorized";
    return fail(
      unauthorized ? "UNAUTHORIZED" : "RATE_LIMITED",
      unauthorized ? "Sign in to continue." : "Too many uploads. Wait a minute and try again.",
      unauthorized ? 401 : 429,
      { headers: { "Retry-After": String(rl.retryAfterSeconds || 60) } }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return fail("INVALID_INPUT", "Choose a PDF or DOCX file.", 400);
    }
    const extracted = await extractResumeFile(file, "api/resume-text");
    if (!extracted.ok) {
      return fail(extracted.status === 500 ? "SERVER_ERROR" : "INVALID_INPUT", extracted.message, extracted.status);
    }
    const text = normalizeResumeText(extracted.text);
    if (!text) {
      return fail("INVALID_INPUT", "We couldn't find any text in that file. Try a DOCX, or paste the text instead.", 422);
    }
    return Response.json({ text });
  } catch (error) {
    captureServerException(error, { route: "api/resume-text" });
    return fail("SERVER_ERROR", "Couldn't read that file. Try again, or paste the text instead.", 500);
  }
}
