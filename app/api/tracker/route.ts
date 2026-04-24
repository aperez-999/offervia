export const dynamic = "force-dynamic";

import { z } from "zod";
import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/ssr";
import { fail } from "@/lib/api/response";
import { captureServerException } from "@/lib/monitoring/sentry";

async function getAuthedUserId(req: NextRequest): Promise<string | null> {
  const supabase = createSupabaseServerClient({
    get(name: string) {
      return req.cookies.get(name)?.value;
    },
  });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user?.id) return null;
  return user.id;
}

function getAuthedSupabase(req: NextRequest) {
  return createSupabaseServerClient({
    get(name: string) {
      return req.cookies.get(name)?.value;
    },
  });
}

const trackerPayloadSchema = z
  .object({
    company: z.string().min(1, "company is required").max(200).optional(),
    role: z.string().min(1, "role is required").max(200).optional(),
    position: z.string().min(1, "position is required").max(200).optional(),
    source: z
      .string()
      .max(200)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v === "" ? undefined : v)),
    resume_used: z.string().max(200).optional(),
    status: z.string().min(1).max(100).optional(),
    follow_up_date: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
    applied_on: z.string().datetime({ offset: true }).or(z.string().date()).optional(),
    notes: z.string().max(5000).optional(),
  })
  .strict();

const createSchema = trackerPayloadSchema.refine(
  (val) => Boolean(val.company?.trim()) && Boolean(val.role?.trim() || val.position?.trim()) && Boolean(val.status),
  {
    message: "company, role, and status are required",
  }
);

const updateSchema = trackerPayloadSchema.refine((val) => Object.keys(val).length > 0, {
  message: "At least one field must be provided",
});

const idSchema = z.object({ id: z.string().uuid("invalid id") });

const RATE_LIMIT_GET = { perMinute: 60, perDay: 500 };
const RATE_LIMIT_WRITE = { perMinute: 20, perDay: 200 };

function errResponse(code: Parameters<typeof fail>[0], message: string, status: number) {
  return fail(code, message, status);
}

type TrackerPayload = z.infer<typeof trackerPayloadSchema>;

type NormalizedTrackerPayload = {
  company?: string;
  role?: string;
  source?: string;
  resume_used?: string;
  status?: string;
  follow_up_date?: string;
  notes?: string;
};

type TrackerRow = {
  id: string;
  user_id: string;
  company: string;
  role?: string | null;
  position?: string | null;
  status: string;
  follow_up_date?: string | null;
  applied_on?: string | null;
  source?: string | null;
  resume_used?: string | null;
  notes?: string | null;
  created_at: string;
};

function trimOrUndefined(value?: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeTrackerPayload(payload: TrackerPayload): NormalizedTrackerPayload {
  return {
    company: trimOrUndefined(payload.company),
    role: trimOrUndefined(payload.role) ?? trimOrUndefined(payload.position),
    source: trimOrUndefined(payload.source),
    resume_used: trimOrUndefined(payload.resume_used),
    status: trimOrUndefined(payload.status),
    follow_up_date: trimOrUndefined(payload.follow_up_date) ?? trimOrUndefined(payload.applied_on),
    notes: trimOrUndefined(payload.notes),
  };
}

function withDefinedValues<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

function normalizeTrackerRow(row: TrackerRow) {
  const role = trimOrUndefined(row.role ?? undefined) ?? trimOrUndefined(row.position ?? undefined) ?? "";
  const followUpDate =
    trimOrUndefined(row.follow_up_date ?? undefined) ??
    trimOrUndefined(row.applied_on ?? undefined) ??
    "";

  return {
    ...row,
    role,
    position: role,
    follow_up_date: followUpDate,
    applied_on: followUpDate,
  };
}

function getCanonicalWritePayload(payload: NormalizedTrackerPayload) {
  return withDefinedValues({
    company: payload.company,
    role: payload.role,
    source: payload.source,
    resume_used: payload.resume_used,
    status: payload.status,
    follow_up_date: payload.follow_up_date,
    notes: payload.notes,
  });
}

function getLegacyWritePayload(payload: NormalizedTrackerPayload) {
  return withDefinedValues({
    company: payload.company,
    position: payload.role,
    source: payload.source,
    resume_used: payload.resume_used,
    status: payload.status,
    applied_on: payload.follow_up_date,
    notes: payload.notes,
  });
}

async function insertApplication(
  supabase: ReturnType<typeof getAuthedSupabase>,
  userId: string,
  payload: NormalizedTrackerPayload
) {
  const canonical = await supabase
    .from("applications")
    .insert({ ...getCanonicalWritePayload(payload), user_id: userId })
    .select("*")
    .single();

  if (!canonical.error) return canonical;

  const legacy = await supabase
    .from("applications")
    .insert({ ...getLegacyWritePayload(payload), user_id: userId })
    .select("*")
    .single();

  return legacy.error ? canonical : legacy;
}

async function updateApplication(
  supabase: ReturnType<typeof getAuthedSupabase>,
  userId: string,
  id: string,
  payload: NormalizedTrackerPayload
) {
  const canonical = await supabase
    .from("applications")
    .update(getCanonicalWritePayload(payload))
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  if (!canonical.error) return canonical;

  const legacy = await supabase
    .from("applications")
    .update(getLegacyWritePayload(payload))
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .maybeSingle();

  return legacy.error ? canonical : legacy;
}

export async function GET(req: NextRequest) {
  const userId = await getAuthedUserId(req);
  if (!userId) return errResponse("UNAUTHORIZED", "Authentication required.", 401);

  const { checkRateLimitWithUserId } = await import("@/lib/rate-limit");
  const { getServiceSupabase } = await import("@/lib/supabase/service");
  const serviceSupabase = getServiceSupabase();
  const rl = await checkRateLimitWithUserId(serviceSupabase, userId, "tracker_get", RATE_LIMIT_GET);
  if (!rl.ok) {
    const retry = rl.retryAfterSeconds ?? 60;
    return fail("RATE_LIMITED", "Too many requests. Try again soon.", 429, {
      headers: { "Retry-After": String(retry) },
    });
  }

  const supabase = getAuthedSupabase(req);
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    captureServerException(error, { route: "api/tracker", extras: { method: "GET" } });
    console.error("[tracker] GET fetch applications", error.message);
    return errResponse("SERVER_ERROR", "Something went wrong.", 500);
  }
  return Response.json({
    success: true,
    data: ((data || []) as TrackerRow[]).map(normalizeTrackerRow),
  });
}

export async function POST(req: NextRequest) {
  const userId = await getAuthedUserId(req);
  if (!userId) return errResponse("UNAUTHORIZED", "Authentication required.", 401);

  const { checkRateLimitWithUserId } = await import("@/lib/rate-limit");
  const { getServiceSupabase } = await import("@/lib/supabase/service");
  const serviceSupabase = getServiceSupabase();
  const rlPost = await checkRateLimitWithUserId(serviceSupabase, userId, "tracker_write", RATE_LIMIT_WRITE);
  if (!rlPost.ok) {
    const retry = rlPost.retryAfterSeconds ?? 60;
    return fail("RATE_LIMITED", "Too many requests. Try again soon.", 429, {
      headers: { "Retry-After": String(retry) },
    });
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

  const supabase = getAuthedSupabase(req);
  const normalizedPayload = normalizeTrackerPayload(parsed.data);
  const { data, error } = await insertApplication(supabase, userId, normalizedPayload);
  if (error) {
    captureServerException(error, { route: "api/tracker", extras: { method: "POST" } });
    console.error("[tracker] POST insert", error.message);
    return errResponse("SERVER_ERROR", "Something went wrong.", 500);
  }
  return Response.json({
    success: true,
    data: normalizeTrackerRow(data as TrackerRow),
  });
}

export async function PATCH(req: NextRequest) {
  const userId = await getAuthedUserId(req);
  if (!userId) return errResponse("UNAUTHORIZED", "Authentication required.", 401);

  const { checkRateLimitWithUserId } = await import("@/lib/rate-limit");
  const { getServiceSupabase } = await import("@/lib/supabase/service");
  const serviceSupabase = getServiceSupabase();
  const rlPatch = await checkRateLimitWithUserId(serviceSupabase, userId, "tracker_write", RATE_LIMIT_WRITE);
  if (!rlPatch.ok) {
    const retry = rlPatch.retryAfterSeconds ?? 60;
    return fail("RATE_LIMITED", "Too many requests. Try again soon.", 429, {
      headers: { "Retry-After": String(retry) },
    });
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

  const normalizedPayload = normalizeTrackerPayload(updateParsed.data);
  const supabase = getAuthedSupabase(req);
  const { id } = parsedId.data;
  const { data, error } = await updateApplication(supabase, userId, id, normalizedPayload);

  if (error) {
    captureServerException(error, { route: "api/tracker", extras: { method: "PATCH", id } });
    console.error("[tracker] PATCH update", error.message);
    return errResponse("SERVER_ERROR", "Something went wrong.", 500);
  }
  return Response.json({
    success: true,
    data: data ? normalizeTrackerRow(data as TrackerRow) : null,
  });
}

export async function DELETE(req: NextRequest) {
  const userId = await getAuthedUserId(req);
  if (!userId) return errResponse("UNAUTHORIZED", "Authentication required.", 401);

  const { checkRateLimitWithUserId } = await import("@/lib/rate-limit");
  const { getServiceSupabase } = await import("@/lib/supabase/service");
  const serviceSupabase = getServiceSupabase();
  const rlDel = await checkRateLimitWithUserId(serviceSupabase, userId, "tracker_write", RATE_LIMIT_WRITE);
  if (!rlDel.ok) {
    const retry = rlDel.retryAfterSeconds ?? 60;
    return fail("RATE_LIMITED", "Too many requests. Try again soon.", 429, {
      headers: { "Retry-After": String(retry) },
    });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const parsedId = idSchema.safeParse({ id });
  if (!parsedId.success) {
    console.error("[tracker] DELETE invalid id", parsedId.error.flatten());
    return errResponse("INVALID_INPUT", "Invalid request.", 400);
  }

  const supabase = getAuthedSupabase(req);
  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", parsedId.data.id)
    .eq("user_id", userId);
  if (error) {
    captureServerException(error, {
      route: "api/tracker",
      extras: { method: "DELETE", id: parsedId.data.id },
    });
    console.error("[tracker] DELETE", error.message);
    return errResponse("SERVER_ERROR", "Something went wrong.", 500);
  }
  return Response.json({ success: true });
}
