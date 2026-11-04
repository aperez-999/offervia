import { z } from "zod";
import { getGroqClient, DEFAULT_GROQ_MODEL } from "@/lib/groq";
import { checkFeatureGate } from "@/lib/usage/featureGate";
import { incrementUsage } from "@/lib/usage/increment";
import { fail } from "@/lib/api/response";
import { getServiceSupabase } from "@/lib/supabase/service";
import { captureServerException } from "@/lib/monitoring/sentry";
import { QUESTION_COUNT } from "@/lib/interview/config";
import type { AnswerFeedback, TranscriptEntry } from "@/lib/interview/config";
import { readCareerProfile } from "@/lib/profile/read";
import { buildProfileContext } from "@/lib/profile/career";
import {
  buildQuestionSystemPrompt,
  buildQuestionUserPrompt,
  buildScoreSystemPrompt,
  buildScoreUserPrompt,
  buildSummarySystemPrompt,
  buildSummaryUserPrompt,
} from "@/lib/interview/prompts";

const startSchema = z.object({
  action: z.literal("start"),
  roleTitle: z.string().trim().min(2).max(120),
  focus: z.enum(["behavioral", "technical", "mixed"]),
  difficulty: z.enum(["intro", "standard", "senior"]),
});

const answerSchema = z.object({
  action: z.literal("answer"),
  sessionId: z.string().uuid(),
  questionIndex: z.number().int().min(0).max(QUESTION_COUNT - 1),
  answer: z.string().trim().min(1).max(4000),
});

const finishSchema = z.object({
  action: z.literal("finish"),
  sessionId: z.string().uuid(),
});

const bodySchema = z.discriminatedUnion("action", [
  startSchema,
  answerSchema,
  finishSchema,
]);

type InterviewSessionRow = {
  id: string;
  user_id: string;
  role_title: string;
  focus: "behavioral" | "technical" | "mixed";
  difficulty: "intro" | "standard" | "senior";
  questions: string[];
  transcript: TranscriptEntry[];
  status: "active" | "completed";
};

function parseJsonObject<T>(raw: string): T {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  const slice = start >= 0 && end >= start ? cleaned.slice(start, end + 1) : cleaned;
  return JSON.parse(slice) as T;
}

async function groqJson(system: string, user: string, maxTokens: number): Promise<string> {
  const groq = getGroqClient();
  const result = await groq.chat.completions.create({
    model: DEFAULT_GROQ_MODEL,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: 0.4,
    max_tokens: maxTokens,
    response_format: { type: "json_object" },
  });
  return (result?.choices?.[0]?.message?.content as string | undefined) || "";
}

function clampScore(value: unknown): number {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

function cleanList(value: unknown, max: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((v) => String(v).trim())
    .filter(Boolean)
    .slice(0, max);
}

export async function POST(req: Request) {
  const { checkRateLimitForApi } = await import("@/lib/rate-limit");
  const rl = await checkRateLimitForApi(req, "interview", {
    perMinute: 10,
    perHour: 120,
    perDay: 400,
  });

  if (!rl.ok) {
    const retry = rl.retryAfterSeconds || 60;
    const msg =
      rl.reason === "unauthorized"
        ? "Sign in to continue."
        : "Too many requests. Wait a minute and try again.";
    return fail(
      rl.reason === "unauthorized" ? "UNAUTHORIZED" : "RATE_LIMITED",
      msg,
      rl.reason === "unauthorized" ? 401 : 429,
      { headers: { "Retry-After": String(retry) } }
    );
  }

  const userId = rl.userId!;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return fail("INVALID_INPUT", "That request wasn't valid. Refresh the page and try again.", 400);
  }

  const supabase = getServiceSupabase();

  // Personalize prompts with the candidate's career profile (empty-safe).
  const profileContext = buildProfileContext(await readCareerProfile(supabase, userId));

  try {
    if (parsed.data.action === "start") {
      const gate = await checkFeatureGate(userId, "interview_session");
      if (!gate.allowed) {
        return fail(
          "PLAN_LIMIT_REACHED",
          "You've used this month's mock interviews. Upgrade to Pro for more.",
          403
        );
      }

      const { roleTitle, focus, difficulty } = parsed.data;
      const raw = await groqJson(
        buildQuestionSystemPrompt(),
        buildQuestionUserPrompt({ roleTitle, focus, difficulty, count: QUESTION_COUNT, profileContext }),
        700
      );

      let questions: string[] = [];
      try {
        const obj = parseJsonObject<{ questions: unknown }>(raw);
        questions = cleanList(obj.questions, QUESTION_COUNT);
      } catch {
        questions = [];
      }

      if (questions.length === 0) {
        return fail("SERVER_ERROR", "Couldn't write questions for that role. Try again.", 502);
      }

      const { data, error } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: userId,
          role_title: roleTitle,
          focus,
          difficulty,
          questions,
          transcript: [],
          status: "active",
        })
        .select("id")
        .single();

      if (error || !data) {
        throw new Error("Failed to create interview session");
      }

      await incrementUsage(userId, "interview_session");

      return Response.json({
        sessionId: data.id,
        roleTitle,
        focus,
        difficulty,
        questions,
        questionIndex: 0,
      });
    }

    // answer + finish both need the session, scoped to this user.
    const { data: sessionData, error: loadError } = await supabase
      .from("interview_sessions")
      .select("id,user_id,role_title,focus,difficulty,questions,transcript,status")
      .eq("id", parsed.data.sessionId)
      .eq("user_id", userId)
      .maybeSingle();

    if (loadError) throw loadError;
    if (!sessionData) {
      return fail("BAD_REQUEST", "That interview session wasn't found. Start a new one.", 404);
    }

    const session = sessionData as InterviewSessionRow;
    const transcript: TranscriptEntry[] = Array.isArray(session.transcript)
      ? session.transcript
      : [];

    if (parsed.data.action === "answer") {
      const { questionIndex, answer } = parsed.data;
      const question = session.questions[questionIndex];
      if (!question) {
        return fail("INVALID_INPUT", "That question isn't part of this session. Refresh and try again.", 400);
      }

      let feedback: AnswerFeedback;
      try {
        const raw = await groqJson(
          buildScoreSystemPrompt(),
          buildScoreUserPrompt({
            roleTitle: session.role_title,
            focus: session.focus,
            question,
            answer,
            profileContext,
          }),
          500
        );
        const obj = parseJsonObject<Partial<AnswerFeedback>>(raw);
        feedback = {
          score: clampScore(obj.score),
          strengths: cleanList(obj.strengths, 3),
          improvements: cleanList(obj.improvements, 3),
          tip: String(obj.tip ?? "").trim().slice(0, 400),
        };
      } catch (error) {
        captureServerException(error, {
          route: "api/interview",
          extras: { stage: "score-answer" },
        });
        return fail("SERVER_ERROR", "Couldn't score that answer. Try submitting it again.", 502);
      }

      const entry: TranscriptEntry = { question, answer, ...feedback };
      const nextTranscript = [...transcript];
      nextTranscript[questionIndex] = entry;

      const { error: updateError } = await supabase
        .from("interview_sessions")
        .update({ transcript: nextTranscript })
        .eq("id", session.id)
        .eq("user_id", userId);
      if (updateError) throw updateError;

      return Response.json({
        feedback: entry,
        questionIndex,
        isLast: questionIndex >= session.questions.length - 1,
      });
    }

    // finish
    const answered = transcript.filter(Boolean);
    if (answered.length === 0) {
      return fail("INVALID_INPUT", "Answer at least one question first.", 400);
    }

    const overallScore = Math.round(
      answered.reduce((sum, t) => sum + (t.score || 0), 0) / answered.length
    );

    let summary = "";
    try {
      const raw = await groqJson(
        buildSummarySystemPrompt(),
        buildSummaryUserPrompt({
          roleTitle: session.role_title,
          overallScore,
          transcript: answered.map((t) => ({
            question: t.question,
            score: t.score,
            improvements: t.improvements,
          })),
        }),
        400
      );
      const obj = parseJsonObject<{ summary?: string }>(raw);
      summary = String(obj.summary ?? "").trim();
    } catch {
      summary = "";
    }

    const { error: finishError } = await supabase
      .from("interview_sessions")
      .update({
        status: "completed",
        overall_score: overallScore,
        summary: summary || null,
        completed_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .eq("user_id", userId);
    if (finishError) throw finishError;

    return Response.json({ overallScore, summary, transcript: answered });
  } catch (error) {
    captureServerException(error, { route: "api/interview" });
    return fail("SERVER_ERROR", "Something went wrong with the interview. Try again.", 500);
  }
}
