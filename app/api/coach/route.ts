import { NextResponse } from "next/server";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { SYSTEM_PROMPTS } from "@/components/coach/system-prompts";

type Role = "system" | "user" | "assistant";
export type CoachMode = "interview" | "resume" | "career";

interface ChatMessage {
  role: Role;
  content: string;
}

export async function POST(req: Request) {
  // ---- Rate limit (coach) ----
  try {
    const mod = await import("@/lib/rate-limit");
    const enforceRateLimit = (mod as any).enforceRateLimit as
      | ((kind: string, req: Request, limits: any) => Promise<any>)
      | undefined;

    if (enforceRateLimit) {
      const rl = await enforceRateLimit("coach", req, {
        perMinute: 8,
        perHour: 100,
        perDay: 300,
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
    // no-op: if rate-limit module can’t be loaded, don’t block the request
  }

  try {
    const { mode, messages } = (await req.json()) as {
      mode: CoachMode;
      messages: ChatMessage[]; // should include a system at [0] built client-side
    };

    if (!mode || !(mode in SYSTEM_PROMPTS)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    const groq = getGroqClient();
    const result = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 800,
    } as any);

    const content = (result as any)?.choices?.[0]?.message?.content?.trim() || "";

    return NextResponse.json({ content });
  } catch (err: any) {
    console.error("Coach API error:", err?.message || err);
    return NextResponse.json(
      { error: "Coach failed to respond" },
      { status: 500 }
    );
  }
}