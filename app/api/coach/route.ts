import { NextResponse } from "next/server";
import { z } from "zod";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { SYSTEM_PROMPTS } from "@/components/coach/system-prompts";
import { checkFeatureGate } from "@/lib/usage/featureGate";
import { incrementUsage } from "@/lib/usage/increment";

export type CoachMode = "interview" | "resume" | "career";

const coachBodySchema = z
  .object({
    mode: z.enum(["interview", "resume", "cover_letter", "career"]),
    responseMode: z.enum(["brief", "detailed"]).optional(),
    messages: z
      .array(
        z.object({
          role: z.enum(["system", "user", "assistant"]),
          content: z.string().min(1).max(2000),
        })
      )
      .min(1)
      .max(20),
  })
  .strict()
  .refine(
    (data) => {
      const total = data.messages.reduce((sum, m) => sum + (m.content?.length ?? 0), 0);
      return total <= 20000;
    },
    { message: "Total message content too long" }
  );

export async function POST(req: Request) {
  const { checkRateLimitForApi } = await import("@/lib/rate-limit");
  const rl = await checkRateLimitForApi(req, "coach", {
    perMinute: 8,
    perHour: 100,
    perDay: 300,
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
    const gate = await checkFeatureGate(userId, "coach");
    if (!gate.allowed) {
      return NextResponse.json(
        {
          error: "PLAN_LIMIT_REACHED",
          message: "You've reached your monthly AI coaching limit. Upgrade to Pro to continue.",
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

    const parsed = coachBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Invalid request." },
        { status: 400 }
      );
    }

    const { mode, responseMode, messages } = parsed.data;

    if (!(mode in SYSTEM_PROMPTS)) {
      return NextResponse.json(
        { error: "INVALID_INPUT", message: "Invalid request." },
        { status: 400 }
      );
    }

    const isBrief = responseMode === "brief";
    const baseSystemPrompt = SYSTEM_PROMPTS[mode];
    const systemPrompt = isBrief
      ? `${baseSystemPrompt}\n\nIMPORTANT: Keep responses concise and practical. Limit to 3-5 sentences or key bullet points. Be direct and actionable.`
      : `${baseSystemPrompt}\n\nIMPORTANT: Provide detailed, thoughtful explanations when needed. Structure your responses clearly with proper formatting and comprehensive information.`;

    const modifiedMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...messages.slice(1),
    ];

    const groq = getGroqClient();
    // Type assertion needed because Groq SDK types are strict but our ChatMessage[] is compatible
    const result = await groq.chat.completions.create({
      model: DEFAULT_GROQ_MODEL,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Groq SDK type mismatch, ChatMessage[] is runtime compatible
      messages: modifiedMessages as any,
      temperature: 0.2,
      max_tokens: isBrief ? 300 : 800, // Shorter responses for brief mode
    });

    const rawContent = (result?.choices?.[0]?.message?.content as string | undefined) || "";
    
    // Clean up the content by trimming redundant newlines
    const content = rawContent.trimStart().replace(/\n{3,}/g, "\n\n").trim();

    await incrementUsage(userId, "coach");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json(
      { error: "SERVER_ERROR", message: "Coach failed to respond." },
      { status: 500 }
    );
  }
}