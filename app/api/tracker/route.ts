export const dynamic = "force-dynamic";

import { z } from "zod";
import { NextRequest } from "next/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { headers } from "next/headers";
/*
*/

function decodeToken(token: string): any | null {
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

function badRequest(message: string, details?: unknown, status = 400) {
  return Response.json({ success: false, error: { message, details } }, { status });
}

export async function GET(req: NextRequest) {
  const userId = await getUserIdFromAuthHeader();
  if (!userId) return badRequest("unauthorized", null, 401);

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return badRequest("failed to fetch applications", error.message, 500);
  return Response.json({ success: true, data });
}

export async function POST(req: NextRequest) {
  const userId = await getUserIdFromAuthHeader();
  if (!userId) return badRequest("unauthorized", null, 401);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return badRequest("invalid JSON body");
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return badRequest("validation error", parsed.error.flatten());

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("applications")
    .insert({ ...parsed.data, user_id: userId })
    .select("*")
    .single();
  if (error) return badRequest("failed to create application", error.message, 500);
  return Response.json({ success: true, data });
}

export async function PATCH(req: NextRequest) {
  const userId = await getUserIdFromAuthHeader();
  if (!userId) return badRequest("unauthorized", null, 401);

  const url = new URL(req.url);
  const idFromQuery = url.searchParams.get("id");

  let body: any = {};
  try {
    body = await req.json();
  } catch {}

  const idValue = idFromQuery ?? body?.id;
  const parsedId = idSchema.safeParse({ id: idValue });
  if (!parsedId.success) return badRequest("missing or invalid id", parsedId.error.flatten());

  const updateParsed = updateSchema.safeParse(body);
  if (!updateParsed.success) return badRequest("validation error", updateParsed.error.flatten());

  const { id } = parsedId.data;
  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("applications")
    .update(updateParsed.data)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (error) return badRequest("failed to update application", error.message, 500);
  return Response.json({ success: true, data });
}

export async function DELETE(req: NextRequest) {
  const userId = await getUserIdFromAuthHeader();
  if (!userId) return badRequest("unauthorized", null, 401);

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const parsedId = idSchema.safeParse({ id });
  if (!parsedId.success) return badRequest("missing or invalid id", parsedId.error.flatten());

  const supabase = getServiceSupabase();
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", parsedId.data.id)
    .eq("user_id", userId);
  if (error) return badRequest("failed to delete application", error.message, 500);
  return Response.json({ success: true });
}
