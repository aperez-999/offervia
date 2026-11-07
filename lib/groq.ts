// lib/groq.ts
import Groq from "groq-sdk";
import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
} from "groq-sdk/resources/chat/completions";
import { serverEnv } from "@/lib/env/server";

export function getGroqClient() {
  const apiKey = serverEnv.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in environment variables");
  }

  return new Groq({
    apiKey,
    // Fail fast instead of hanging if Groq is slow/unreachable; retry transient
    // errors (429/5xx) automatically. Applies to every LLM route centrally.
    timeout: 30_000,
    maxRetries: 2,
  });
}

export const DEFAULT_GROQ_MODEL =
  serverEnv.GROQ_MODEL || "llama-3.1-8b-instant";

/**
 * Second model to try when the first is rate limited. Groq meters each model
 * separately, so this roughly doubles capacity on the free tier. Set
 * GROQ_FALLBACK_MODEL to an empty-ish value like "none" to turn it off.
 */
export const FALLBACK_GROQ_MODEL =
  serverEnv.GROQ_FALLBACK_MODEL === "none"
    ? null
    : serverEnv.GROQ_FALLBACK_MODEL || "llama-3.3-70b-versatile";

/** Thrown when every model we can use is out of capacity right now. */
export class GroqBusyError extends Error {
  constructor(cause?: unknown) {
    super("Groq is rate limited", { cause });
    this.name = "GroqBusyError";
  }
}

export function isGroqBusy(error: unknown): error is GroqBusyError {
  return error instanceof GroqBusyError;
}

function isRateLimited(error: unknown) {
  return error instanceof Groq.APIError && error.status === 429;
}

type CompletionParams = Omit<ChatCompletionCreateParamsNonStreaming, "model"> & {
  model?: string;
};

/**
 * Every AI route goes through here. On a 429 (after the SDK's own retries) it
 * tries the fallback model once, then throws GroqBusyError so the route can
 * answer with a friendly "busy" message that does not use up an allowance.
 */
export async function createChatCompletion(
  params: CompletionParams,
  client: Groq = getGroqClient()
): Promise<ChatCompletion> {
  const primary = params.model ?? DEFAULT_GROQ_MODEL;
  try {
    return await client.chat.completions.create({ ...params, model: primary, stream: false });
  } catch (error) {
    if (!isRateLimited(error)) throw error;
    if (!FALLBACK_GROQ_MODEL || FALLBACK_GROQ_MODEL === primary) {
      throw new GroqBusyError(error);
    }
    try {
      return await client.chat.completions.create({
        ...params,
        model: FALLBACK_GROQ_MODEL,
        stream: false,
      });
    } catch (fallbackError) {
      throw new GroqBusyError(fallbackError);
    }
  }
}
