import { NextResponse } from "next/server";
import { z } from "zod";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { JOB_SCAN_SYSTEM_PROMPT } from "@/lib/job-system-prompt";
import { checkFeatureGate } from "@/lib/usage/featureGate";
import { incrementUsage } from "@/lib/usage/increment";
import { getServiceSupabase } from "@/lib/supabase/service";

const jobScanBodySchema = z.object({ jd: z.string().min(20).max(20000) }).strict();

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
        ? "Authentication required."
        : "Too many requests. Try again soon.";
    return NextResponse.json(
      { error: rl.reason === "unauthorized" ? "UNAUTHORIZED" : "RATE_LIMITED", message: msg },
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

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Invalid request." },
        { status: 400 }
      );
    }

    const parsed = jobScanBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Invalid request." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "SERVER_ERROR", message: "Job scan failed. Try again." },
        { status: 500 }
      );
    }

    if (
      !Array.isArray(aiParsed.strengths) ||
      !Array.isArray(aiParsed.missing_skills) ||
      typeof aiParsed.summary !== "string"
    ) {
      return NextResponse.json(
        { error: "SERVER_ERROR", message: "Job scan failed. Try again." },
        { status: 500 }
      );
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
      { error: "SERVER_ERROR", message: "Job scan failed. Try again." },
      { status: 500 }
    );
  }
}