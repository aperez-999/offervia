import { fail } from "@/lib/api/response";
import { getCurrentUser } from "@/lib/auth/session";
import { getServiceSupabase } from "@/lib/supabase/service";
import { captureServerException } from "@/lib/monitoring/sentry";
import { DELETE_CONFIRMATION } from "@/lib/account";


/**
 * Permanently deletes the signed-in account. Every table keyed to the user is
 * removed by `on delete cascade` when the auth user goes. Two things aren't:
 * avatar files in storage, and request_events (rate-limit log, which holds IPs),
 * so those are removed first.
 */
export async function DELETE(req: Request) {
  const { user, error: authError } = await getCurrentUser();
  if (authError || !user?.id) {
    return fail("UNAUTHORIZED", "Sign in to continue.", 401);
  }

  let body: { confirm?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    // fall through to the check below
  }
  if (typeof body.confirm !== "string" || body.confirm.trim().toLowerCase() !== DELETE_CONFIRMATION) {
    return fail("INVALID_INPUT", `Type "${DELETE_CONFIRMATION}" to confirm.`, 400);
  }

  const userId = user.id;
  const admin = getServiceSupabase();

  try {
    const { data: files } = await admin.storage.from("avatars").list(userId, { limit: 1000 });
    if (files && files.length > 0) {
      await admin.storage.from("avatars").remove(files.map((f) => `${userId}/${f.name}`));
    }

    const events = await admin.from("request_events").delete().eq("user_id", userId);
    if (events.error) throw events.error;

    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw error;

    return Response.json({ deleted: true });
  } catch (error) {
    captureServerException(error, { route: "api/account", extras: { stage: "delete" } });
    return fail("SERVER_ERROR", "Couldn't delete your account. Nothing was removed from your sign-in. Try again in a minute.", 500);
  }
}
