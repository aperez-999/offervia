import { z } from "zod";
import { publicEnv, getPublicEnv } from "@/lib/env/public";

const nonEmpty = z.string().min(1);

const serverEnvSchema = z.object({
  // Supabase service role (server-only)
  SUPABASE_SERVICE_ROLE_KEY: nonEmpty,

  // Groq (server-only)
  GROQ_API_KEY: nonEmpty.optional(),
  GROQ_MODEL: z.string().optional(),

  // Stripe (server-only)
  STRIPE_SECRET_KEY: nonEmpty.optional(),
  STRIPE_WEBHOOK_SECRET: nonEmpty.optional(),

  // Sentry (server-only)
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),

  // Email / contact
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  CONTACT_TO: z.string().optional(),
  CONTACT_FROM: z.string().optional(),
  CONTACT_FROM_NAME: z.string().optional(),
  CONTACT_FROM_EMAIL: z.string().optional(),
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
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    CONTACT_TO: process.env.CONTACT_TO,
    CONTACT_FROM: process.env.CONTACT_FROM,
    CONTACT_FROM_NAME: process.env.CONTACT_FROM_NAME,
    CONTACT_FROM_EMAIL: process.env.CONTACT_FROM_EMAIL,
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
