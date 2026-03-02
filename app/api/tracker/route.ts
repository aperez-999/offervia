export const dynamic = "force-dynamic";

import { z } from "zod";
import { NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { headers } from "next/headers";
/*
*/

function decodeToken(token: string): { sub?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    let payload = parts[1];
    // base64url -> base64
    payload = payload.replace(/-/g, "+").replace(/_/g, "/");
    if (payload.length % 4) payload += "=".repeat(4 - (payload.length % 4));
    const json = typeof atob === "function" ? atob(payload) : Buffer.from(payload, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function getUserIdFromAuthHeader(): Promise<string | null> {
  const hdrs = await headers();
  const auth = (hdrs.get("authorization") || hdrs.get("Authorization") || "").toString().trim();
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  const payload = decodeToken(token);
  const sub = payload?.sub;
  return typeof sub === "string" && sub.length > 0 ? sub : null;
}

const createSchema = z
  .object({
    company: z.string().min(1, "company is required").max(200),
    role: z.string().min(1, "role is required").max(200),
    source: z.string().max(200).optional().or(z.literal("")).transform((v) => (v === "" ? undefined : v)),
    resume_used: z.string().max(200).optional(),
    status: z.string().min(1).max(100),
    follow_up_date: z
      .string()
      .datetime({ offset: true })
      .or(z.string().date())
      .optional(),
    notes: z.string().max(5000).optional(),
  })
  .strict();

const updateSchema = createSchema.partial().refine((val) => Object.keys(val).length > 0, {
  message: "At least one field must be provided",
});

const idSchema = z.object({ id: z.string().uuid("invalid id") });

const RATE_LIMIT_GET = { perMinute: 60, perDay: 500 };
const RATE_LIMIT_WRITE = { perMinute: 20, perDay: 200 };

function errResponse(code: string, message: string, status: number) {
  return Response.json({ error: code, message }, { status });
}

export async function GET() {
  const userId = await getUserIdFromAuthHeader();
  if (!userId) return errResponse("UNAUTHORIZED", "Authentication required.", 401);

  const { checkRateLimitWithUserId } = await import("@/lib/rate-limit");
  const supabase = getServiceSupabase();
  const rl = await checkRateLimitWithUserId(supabase, userId, "tracker_get", RATE_LIMIT_GET);
  if (!rl.ok) {
    const retry = rl.retryAfterSeconds ?? 60;
    return Response.json(
      { error: "RATE_LIMITED", message: "Too many requests. Try again soon." },
      { status: 429, headers: { "Retry-After": String(retry) } }
    );
  }

  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[tracker] GET fetch applications", error.message);
    return errResponse("SERVER_ERROR", "Something went wrong.", 500);
  }
  return Response.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromAuthHeader();
  if (!userId) return errResponse("UNAUTHORIZED", "Authentication required.", 401);

  const { checkRateLimitWithUserId } = await import("@/lib/rate-limit");
  const supabase = getServiceSupabase();
  const rlPost = await checkRateLimitWithUserId(supabase, userId, "tracker_write", RATE_LIMIT_WRITE);
  if (!rlPost.ok) {
    const retry = rlPost.retryAfterSeconds ?? 60;
    return Response.json(
      { error: "RATE_LIMITED", message: "Too many requests. Try again soon." },
      { status: 429, headers: { "Retry-After": String(retry) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errResponse("INVALID_INPUT", "Invalid request.", 400);
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    console.error("[tracker] POST validation", parsed.error.flatten());
    return errResponse("INVALID_INPUT", "Invalid request.", 400);
  }

  const { data, error } = await supabase
    .from("applications")
    .insert({ ...parsed.data, user_id: userId })
    .select("*")
    .single();
  if (error) {
    console.error("[tracker] POST insert", error.message);
    return errResponse("SERVER_ERROR", "Something went wrong.", 500);
  }
  return Response.json({ success: true, data });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserIdFromAuthHeader();
  if (!userId) return errResponse("UNAUTHORIZED", "Authentication required.", 401);

  const { checkRateLimitWithUserId } = await import("@/lib/rate-limit");
  const supabase = getServiceSupabase();
  const rlPatch = await checkRateLimitWithUserId(supabase, userId, "tracker_write", RATE_LIMIT_WRITE);
  if (!rlPatch.ok) {
    const retry = rlPatch.retryAfterSeconds ?? 60;
    return Response.json(
      { error: "RATE_LIMITED", message: "Too many requests. Try again soon." },
      { status: 429, headers: { "Retry-After": String(retry) } }
    );
  }

  const url = new URL(req.url);
  const idFromQuery = url.searchParams.get("id");

  let body: unknown = {};
  try {
    body = await req.json();
  } catch {
    // Body parsing failed, will use empty object
  }

  const bodyId = typeof body === "object" && body !== null && "id" in body ? (body as { id?: unknown }).id : undefined;
  const idValue = idFromQuery ?? bodyId;
  const parsedId = idSchema.safeParse({ id: idValue });
  if (!parsedId.success) {
    console.error("[tracker] PATCH invalid id", parsedId.error.flatten());
    return errResponse("INVALID_INPUT", "Invalid request.", 400);
  }

  const updateParsed = updateSchema.safeParse(body);
  if (!updateParsed.success) {
    console.error("[tracker] PATCH validation", updateParsed.error.flatten());
    return errResponse("INVALID_INPUT", "Invalid request.", 400);
  }

  const { id } = parsedId.data;
  const { data, error } = await supabase
    .from("applications")
    .update(updateParsed.data)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("[tracker] PATCH update", error.message);
    return errResponse("SERVER_ERROR", "Something went wrong.", 500);
  }
  return Response.json({ success: true, data });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserIdFromAuthHeader();
  if (!userId) return errResponse("UNAUTHORIZED", "Authentication required.", 401);

  const { checkRateLimitWithUserId } = await import("@/lib/rate-limit");
  const supabase = getServiceSupabase();
  const rlDel = await checkRateLimitWithUserId(supabase, userId, "tracker_write", RATE_LIMIT_WRITE);
  if (!rlDel.ok) {
    const retry = rlDel.retryAfterSeconds ?? 60;
    return Response.json(
      { error: "RATE_LIMITED", message: "Too many requests. Try again soon." },
      { status: 429, headers: { "Retry-After": String(retry) } }
    );
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const parsedId = idSchema.safeParse({ id });
  if (!parsedId.success) {
    console.error("[tracker] DELETE invalid id", parsedId.error.flatten());
    return errResponse("INVALID_INPUT", "Invalid request.", 400);
  }

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", parsedId.data.id)
    .eq("user_id", userId);
  if (error) {
    console.error("[tracker] DELETE", error.message);
    return errResponse("SERVER_ERROR", "Something went wrong.", 500);
  }
  return Response.json({ success: true });
}
