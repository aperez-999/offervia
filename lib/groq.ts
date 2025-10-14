// lib/groq.ts
import Groq from "groq-sdk";

export function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GROQ_API_KEY in environment variables");
  }

  return new Groq({
    apiKey,
  });
}

export const DEFAULT_GROQ_MODEL =
  process.env.GROQ_MODEL || "llama-3.1-8b-instant";
