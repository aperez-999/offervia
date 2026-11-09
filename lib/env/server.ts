import { z } from "zod";
import { publicEnv, getPublicEnv } from "@/lib/env/public";

const nonEmpty = z.string().min(1);

const serverEnvSchema = z.object({
  // Supabase service role (server-only)
  SUPABASE_SERVICE_ROLE_KEY: nonEmpty,

  // Groq (server-only)
  GROQ_API_KEY: nonEmpty.optional(),
  GROQ_MODEL: z.string().optional(),
  GROQ_FALLBACK_MODEL: z.string().optional(),

  // Sentry (server-only)
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

});

let cached: (z.infer<typeof serverEnvSchema> & typeof publicEnv) | null = null;

export function getServerEnv() {
  if (cached) return cached;

  // ensure public env is valid too (server uses it)
  const pub = getPublicEnv();
  const raw = {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL: process.env.GROQ_MODEL,
    GROQ_FALLBACK_MODEL: process.env.GROQ_FALLBACK_MODEL,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
  };
  const parsed = serverEnvSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables.\n${JSON.stringify(
        parsed.error.flatten().fieldErrors,
        null,
        2
      )}`
    );
  }

  cached = { ...pub, ...parsed.data };
  return cached;
}

export const serverEnv = getServerEnv();
