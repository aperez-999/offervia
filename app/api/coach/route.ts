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
  const { checkRateLimitForApi } = await import("@/lib/rate-limit");
  const rl = await checkRateLimitForApi(req, "coach", {
    perMinute: 8,
    perHour: 100,
    perDay: 300,
  });

  if (!rl.ok) {
    const retry = rl.retryAfterSeconds || 60;
    return NextResponse.json(
      { error: rl.reason === "unauthorized" ? "Authentication required" : "Rate limit reached. Please try again soon." },
      { status: rl.reason === "unauthorized" ? 401 : 429, headers: { "Retry-After": String(retry) } }
    );
  }

  try {
    const { mode, responseMode, messages } = (await req.json()) as {
      mode: CoachMode;
      responseMode?: "brief" | "detailed";
      messages: ChatMessage[]; // should include a system at [0] built client-side
    };

    if (!mode || !(mode in SYSTEM_PROMPTS)) {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }
    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages" }, { status: 400 });
    }

    // Modify system prompt based on response mode
    const isBrief = responseMode === "brief";
    const baseSystemPrompt = SYSTEM_PROMPTS[mode];
    const systemPrompt = isBrief
      ? `${baseSystemPrompt}\n\nIMPORTANT: Keep responses concise and practical. Limit to 3-5 sentences or key bullet points. Be direct and actionable.`
      : `${baseSystemPrompt}\n\nIMPORTANT: Provide detailed, thoughtful explanations when needed. Structure your responses clearly with proper formatting and comprehensive information.`;

    // Update the first message (system prompt) with the modified version
    const modifiedMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(1)
    ];

    const groq = getGroqClient();
    const result = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      messages: modifiedMessages,
      temperature: 0.2,
      max_tokens: isBrief ? 300 : 800, // Shorter responses for brief mode
    } as any);

    const rawContent = (result as any)?.choices?.[0]?.message?.content || "";
    
    // Clean up the content by trimming redundant newlines
    const content = rawContent.trimStart().replace(/\n{3,}/g, "\n\n").trim();

    return NextResponse.json({ content });
  } catch (err: any) {
    console.error("Coach API error:", err?.message || err);
    return NextResponse.json(
      { error: "Coach failed to respond" },
      { status: 500 }
    );
  }
}