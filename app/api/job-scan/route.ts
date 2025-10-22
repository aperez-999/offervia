import { NextResponse } from "next/server";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { JOB_SCAN_SYSTEM_PROMPT } from "@/lib/job-system-prompt";

export async function POST(req: Request) {
  // ---- Rate limit (job-scan) ----
  try {
    const mod = await import("@/lib/rate-limit");
    const enforceRateLimit = (mod as any).enforceRateLimit as
      | ((kind: string, req: Request, limits: any) => Promise<any>)
      | undefined;

    if (enforceRateLimit) {
      const rl = await enforceRateLimit("job-scan", req, {
        perMinute: 6,
        perDay: 150,
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
    const { jd } = (await req.json()) as { jd?: string };
    if (!jd || typeof jd !== "string" || jd.trim().length < 20) {
      return NextResponse.json({ error: "Job description is required" }, { status: 400 });
    }

    const groq = getGroqClient();
    const messages = [
      { role: "system", content: JOB_SCAN_SYSTEM_PROMPT },
      { role: "user", content: jd.slice(0, 20000) },
    ] as const;

    const result = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages: messages as any,
      temperature: 0.2,
      max_tokens: 800,
    } as any);

    const content = (result as any)?.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({ content });
  } catch (err: any) {
    console.error("Job-scan API error:", err?.message || err);
    return NextResponse.json({ error: "Job scan failed" }, { status: 500 });
  }
}