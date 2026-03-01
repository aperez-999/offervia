import { NextResponse } from "next/server";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { JOB_SCAN_SYSTEM_PROMPT } from "@/lib/job-system-prompt";
import { checkFeatureGate } from "@/lib/usage/featureGate";
import { incrementUsage } from "@/lib/usage/increment";
import { getServiceSupabase } from "@/lib/supabase/service";

export async function POST(req: Request) {
  // ---- Rate limit (job-scan) ----
  const { checkRateLimitForApi } = await import("@/lib/rate-limit");
  const rl = await checkRateLimitForApi(req, "job-scan", {
    perMinute: 6,
    perDay: 150,
  });

  if (!rl.ok) {
    const retry = rl.retryAfterSeconds || 60;
    const msg =
      rl.reason === "unauthorized"
        ? "Authentication required"
        : "Rate limit reached. Please try again soon.";
    return NextResponse.json(
      { error: msg, message: msg },
      { status: rl.reason === "unauthorized" ? 401 : 429, headers: { "Retry-After": String(retry) } }
    );
  }

  const userId = rl.userId!;

  try {
    const gate = await checkFeatureGate(userId, "job_scan");
    if (!gate.allowed) {
      return NextResponse.json(
        {
          error: "PLAN_LIMIT_REACHED",
          message: "You've reached your monthly job scan limit. Upgrade to Pro to continue.",
        },
        { status: 403 }
      );
    }

    const { jd } = (await req.json()) as { jd?: string };
    if (!jd || typeof jd !== "string" || jd.trim().length < 20) {
      return NextResponse.json(
        { error: "Job description is required", message: "Job description is required" },
        { status: 400 }
      );
    }

    const groq = getGroqClient();
    const messages = [
      { role: "system" as const, content: JOB_SCAN_SYSTEM_PROMPT },
      { role: "user" as const, content: jd.slice(0, 20000) },
    ];

    const result = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 800,
    });

    const raw = (result?.choices?.[0]?.message?.content as string | undefined)?.trim() || "";
    let parsed: { match_score: number; strengths: string[]; missing_skills: string[]; summary: string };
    try {
      const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
      parsed = JSON.parse(stripped) as typeof parsed;
    } catch {
      return NextResponse.json(
        { error: "Job scan failed: invalid response", message: "Job scan failed: invalid response" },
        { status: 500 }
      );
    }

    if (
      !Array.isArray(parsed.strengths) ||
      !Array.isArray(parsed.missing_skills) ||
      typeof parsed.summary !== "string"
    ) {
      return NextResponse.json(
        { error: "Job scan failed: invalid response", message: "Job scan failed: invalid response" },
        { status: 500 }
      );
    }

    const score = Number(parsed.match_score);
    const match_score =
      Number.isFinite(score) ? Math.min(100, Math.max(0, Math.round(score))) : 50;
    const content = {
      match_score,
      strengths: parsed.strengths.map((s) => (typeof s === "string" ? s : String(s))),
      missing_skills: parsed.missing_skills.map((s) => (typeof s === "string" ? s : String(s))),
      summary: String(parsed.summary),
    };

    const supabase = getServiceSupabase();
    const { error: insertErr } = await supabase.from("job_scans").insert({
      user_id: userId,
      match_score: content.match_score,
      strengths: content.strengths,
      missing_skills: content.missing_skills,
      summary: content.summary,
    });
    if (insertErr) {
      // Non-fatal: still return scan result
    }

    await incrementUsage(userId, "job_scan");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json(
      { error: "Job scan failed", message: "Job scan failed" },
      { status: 500 }
    );
  }
}