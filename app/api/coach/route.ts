import { z } from "zod";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { SYSTEM_PROMPTS } from "@/components/coach/system-prompts";
import { checkFeatureGate } from "@/lib/usage/featureGate";
import { incrementUsage } from "@/lib/usage/increment";
import { fail } from "@/lib/api/response";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { getServiceSupabase } from "@/lib/supabase/service";
import { captureServerException } from "@/lib/monitoring/sentry";
import { readCareerProfile } from "@/lib/profile/read";
import { buildProfileContext } from "@/lib/profile/career";

export type CoachMode = "interview" | "resume" | "cover_letter" | "career";

type PersistedCoachMessage = {
  id: string;
  user_id: string;
  mode: CoachMode;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

const coachModeSchema = z.enum(["interview", "resume", "cover_letter", "career"]);

const coachBodySchema = z
  .object({
    mode: coachModeSchema,
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

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    if (name) cookies[name] = rest.join("=").trim();
  });
  return cookies;
}

async function getAuthenticatedUserId(req: Request): Promise<string | null> {
  const cookies = parseCookies(req.headers.get("cookie") || "");
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return cookies[name];
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) return null;
  return user.id;
}

function buildSystemPrompt(
  mode: CoachMode,
  responseMode?: "brief" | "detailed",
  profileContext?: string
) {
  const baseSystemPrompt = SYSTEM_PROMPTS[mode];
  const profileBlock = profileContext
    ? `\n\n${profileContext}\nUse this context to tailor advice to the candidate. Do not restate it back to them.`
    : "";
  if (responseMode === "brief") {
    return `${baseSystemPrompt}${profileBlock}\n\nIMPORTANT: Keep responses concise and practical. Limit to 3-5 sentences or key bullet points. Be direct and actionable.`;
  }
  return `${baseSystemPrompt}${profileBlock}\n\nIMPORTANT: Provide detailed, thoughtful explanations when needed. Structure your responses clearly with proper formatting and comprehensive information.`;
}

async function insertMessage(message: {
  user_id: string;
  mode: CoachMode;
  role: "user" | "assistant";
  content: string;
}): Promise<PersistedCoachMessage> {
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("messages")
    .insert(message)
    .select("id,user_id,mode,role,content,created_at")
    .single();

  if (error || !data) {
    throw new Error("Failed to persist coach message");
  }

  return data as PersistedCoachMessage;
}

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
    return fail(
      rl.reason === "unauthorized" ? "UNAUTHORIZED" : "RATE_LIMITED",
      msg,
      rl.reason === "unauthorized" ? 401 : 429,
      {
        headers: { "Retry-After": String(retry) },
      }
    );
  }

  const userId = rl.userId!;

  try {
    const gate = await checkFeatureGate(userId, "coach");
    if (!gate.allowed) {
      return fail(
        "PLAN_LIMIT_REACHED",
        "You've reached your monthly AI coaching limit. Upgrade to Pro to continue.",
        403
      );
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return fail("INVALID_INPUT", "Invalid request.", 400);
    }

    const parsed = coachBodySchema.safeParse(body);
    if (!parsed.success) {
      return fail("INVALID_INPUT", "Invalid request.", 400);
    }

    const { mode, responseMode, messages } = parsed.data;

    if (!(mode in SYSTEM_PROMPTS)) {
      return fail("INVALID_INPUT", "Invalid request.", 400);
    }

    const userInput = messages[messages.length - 1];
    if (!userInput || userInput.role !== "user") {
      return fail("INVALID_INPUT", "Invalid request.", 400);
    }

    const userMessage = await insertMessage({
      user_id: userId,
      mode,
      role: "user",
      content: userInput.content,
    });

    try {
      const profileContext = buildProfileContext(
        await readCareerProfile(getServiceSupabase(), userId)
      );
      const systemPrompt = buildSystemPrompt(mode, responseMode, profileContext);
      const modifiedMessages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...messages.slice(1),
      ];

      const groq = getGroqClient();
      const isBrief = responseMode === "brief";
      const result = await groq.chat.completions.create({
        model: DEFAULT_GROQ_MODEL,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Groq SDK type mismatch, ChatMessage[] is runtime compatible
        messages: modifiedMessages as any,
        temperature: 0.2,
        max_tokens: isBrief ? 300 : 800,
      });

      const rawContent = (result?.choices?.[0]?.message?.content as string | undefined) || "";
      const content = rawContent.trimStart().replace(/\n{3,}/g, "\n\n").trim();

      const assistantMessage = await insertMessage({
        user_id: userId,
        mode,
        role: "assistant",
        content,
      });

      await incrementUsage(userId, "coach");
      return Response.json({ content, userMessage, assistantMessage });
    } catch (error) {
      captureServerException(error, {
        route: "api/coach",
        extras: { stage: "assistant-response" },
      });
      return Response.json(
        {
          error: "SERVER_ERROR",
          message: "Coach failed to respond.",
          userMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    captureServerException(error, { route: "api/coach" });
    return fail("SERVER_ERROR", "Coach failed to respond.", 500);
  }
}

export async function DELETE(req: Request) {
  const userId = await getAuthenticatedUserId(req);
  if (!userId) {
    return fail("UNAUTHORIZED", "Authentication required.", 401);
  }

  const mode = new URL(req.url).searchParams.get("mode");
  const parsedMode = coachModeSchema.safeParse(mode);
  if (!parsedMode.success) {
    return fail("INVALID_INPUT", "Invalid request.", 400);
  }

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("user_id", userId)
    .eq("mode", parsedMode.data);

  if (error) {
    captureServerException(error, {
      route: "api/coach",
      extras: { stage: "delete-history", mode: parsedMode.data },
    });
    return fail("SERVER_ERROR", "Failed to clear conversation.", 500);
  }

  return Response.json({ success: true });
}
