import { NextResponse } from "next/server";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { JOB_SCAN_SYSTEM_PROMPT } from "@/lib/job-system-prompt";
import { checkFeatureGate } from "@/lib/featureGate";
import { incrementUsage } from "@/lib/usage";

export async function POST(req: Request) {
  // ---- Rate limit (job-scan) ----
  const { checkRateLimitForApi } = await import("@/lib/rate-limit");
  const rl = await checkRateLimitForApi(req, "job-scan", {
    perMinute: 6,
    perDay: 150,
  });

  if (!rl.ok) {
    const retry = rl.retryAfterSeconds || 60;
    return NextResponse.json(
      { error: rl.reason === "unauthorized" ? "Authentication required" : "Rate limit reached. Please try again soon." },
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
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
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

    const content = (result?.choices?.[0]?.message?.content as string | undefined)?.trim() || "";
    await incrementUsage(userId, "job_scan");
    return NextResponse.json({ content });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error("Job-scan API error:", errorMessage);
    return NextResponse.json({ error: "Job scan failed" }, { status: 500 });
  }
}