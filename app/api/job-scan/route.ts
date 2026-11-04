import { z } from "zod";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { JOB_SCAN_SYSTEM_PROMPT } from "@/lib/job-system-prompt";
import { checkFeatureGate } from "@/lib/usage/featureGate";
import { incrementUsage } from "@/lib/usage/increment";
import { getServiceSupabase } from "@/lib/supabase/service";
import { fail } from "@/lib/api/response";
import { captureServerException } from "@/lib/monitoring/sentry";

const jobScanBodySchema = z.object({ jd: z.string().min(20).max(20000) }).strict();

function titleFromJD(text: string) {
  const first =
    (text || "")
      .split("\n")
      .map((s) => s.trim())
      .find(Boolean) || "Job scan";
  return first.length > 120 ? first.slice(0, 117) + "…" : first;
}

export async function POST(req: Request) {
  const { checkRateLimitForApi } = await import("@/lib/rate-limit");
  const rl = await checkRateLimitForApi(req, "job-scan", {
    perMinute: 6,
    perDay: 150,
  });

  if (!rl.ok) {
    const retry = rl.retryAfterSeconds || 60;
    const msg =
      rl.reason === "unauthorized"
        ? "Sign in to continue."
        : "Too many requests. Wait a minute and try again.";
    return fail(rl.reason === "unauthorized" ? "UNAUTHORIZED" : "RATE_LIMITED", msg, rl.reason === "unauthorized" ? 401 : 429, {
      headers: { "Retry-After": String(retry) },
    });
  }

  const userId = rl.userId!;

  try {
    const gate = await checkFeatureGate(userId, "job_scan");
    if (!gate.allowed) {
      return fail(
        "PLAN_LIMIT_REACHED",
        "You've used this month's job scans. Upgrade to Pro for more.",
        403
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
    }

    const parsed = jobScanBodySchema.safeParse(body);
    if (!parsed.success) {
      return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
    }

    const { jd } = parsed.data;

    const groq = getGroqClient();
    const messages = [
      { role: "system" as const, content: JOB_SCAN_SYSTEM_PROMPT },
      { role: "user" as const, content: jd },
    ];

    const result = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 800,
    });

    const raw = (result?.choices?.[0]?.message?.content as string | undefined)?.trim() || "";
    let aiParsed: { match_score: number; strengths: string[]; missing_skills: string[]; summary: string };
    try {
      const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      aiParsed = JSON.parse(stripped) as typeof aiParsed;
    } catch {
      return fail("SERVER_ERROR", "The job scan didn't finish. Try again.", 500);
    }

    if (
      !Array.isArray(aiParsed.strengths) ||
      !Array.isArray(aiParsed.missing_skills) ||
      typeof aiParsed.summary !== "string"
    ) {
      return fail("SERVER_ERROR", "The job scan didn't finish. Try again.", 500);
    }

    const score = Number(aiParsed.match_score);
    const match_score =
      Number.isFinite(score) ? Math.min(100, Math.max(0, Math.round(score))) : 50;
    const content = {
      match_score,
      strengths: aiParsed.strengths.map((s) => (typeof s === "string" ? s : String(s))),
      missing_skills: aiParsed.missing_skills.map((s) => (typeof s === "string" ? s : String(s))),
      summary: String(aiParsed.summary),
    };

    const supabase = getServiceSupabase();
    const { error: insertErr } = await supabase.from("job_scans").insert({
      user_id: userId,
      jd_excerpt: jd.slice(0, 1500),
      title: titleFromJD(jd),
      match_score: content.match_score,
      strengths: content.strengths,
      missing_skills: content.missing_skills,
      summary: content.summary,
    });
    if (insertErr) {
      // Non-fatal: still return scan result
    }

    await incrementUsage(userId, "job_scan");
    return Response.json({ content });
  } catch (error) {
    captureServerException(error, { route: "api/job-scan" });
    return fail("SERVER_ERROR", "The job scan didn't finish. Try again.", 500);
  }
}
