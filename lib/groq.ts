// lib/groq.ts
import Groq from "groq-sdk";
import { serverEnv } from "@/lib/env/server";

export function getGroqClient() {
  const apiKey = serverEnv.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in environment variables");
  }

  return new Groq({
    apiKey,
  });
}

export const DEFAULT_GROQ_MODEL =
  serverEnv.GROQ_MODEL || "llama-3.1-8b-instant";
