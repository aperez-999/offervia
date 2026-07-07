import { serverEnv } from "@/lib/env/server";
import { getServiceSupabase } from "@/lib/supabase/service";
import { sendUserDigestEmail } from "@/lib/email";
import { fail } from "@/lib/api/response";

function requireCronAuth(req: Request) {
  const secret = serverEnv.CRON_SECRET;
  // Dev-friendly default, but fail closed in production if not configured.
  if (!secret) {
    return serverEnv.NODE_ENV !== "production";
  }
  const got = req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret");
  return got === secret;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function POST(req: Request) {
  if (!requireCronAuth(req)) {
    return fail("UNAUTHORIZED", "Unauthorized", 401);
  }

  const supabase = getServiceSupabase();

  // Users who opted in
  const { data: prefs, error: prefsErr } = await supabase
    .from("user_prefs")
    .select("user_id,weekly_goal,email_digest")
    .eq("email_digest", true);

  if (prefsErr) {
    console.error("[weekly-digest] prefs query failed", prefsErr);
    return fail("SERVER_ERROR", "Failed to build digest.", 500);
  }

  const optedIn = (prefs ?? []).filter((p) => p?.user_id);
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const weekAgoIso = weekAgo.toISOString();

  let sent = 0;
  let failed = 0;

  for (const p of optedIn) {
    const userId = p.user_id as string;
    try {
      // get email from auth
      const { data: userRes, error: userErr } = await supabase.auth.admin.getUserById(userId);
      const toEmail = userRes?.user?.email;
      if (userErr || !toEmail) {
        failed++;
        continue;
      }

      const weeklyGoal = typeof p.weekly_goal === "number" ? p.weekly_goal : 5;

      const [{ data: apps }, { data: due }] = await Promise.all([
        supabase
          .from("applications")
          .select("status,created_at,follow_up_date")
          .eq("user_id", userId)
          .gte("created_at", weekAgoIso),
        supabase
          .from("applications")
          .select("company,position,follow_up_date,status")
          .eq("user_id", userId)
          .not("follow_up_date", "is", null)
          .gte("follow_up_date", isoDate(now))
          .lte("follow_up_date", isoDate(weekAhead)),
      ]);

      const appsList = apps ?? [];
      const applied = appsList.length;
      const interviewing = appsList.filter((a) => a.status === "Interviewing").length;
      const offers = appsList.filter((a) => a.status === "Offer").length;
      const dueList = (due ?? []).slice(0, 8);

      const subject = `Your Offervia weekly summary (${isoDate(weekAgo)} → ${isoDate(now)})`;
      const preheader = `${applied} new applications • ${dueList.length} follow-ups coming up`;

      const text = [
        `Offervia weekly summary`,
        ``,
        `New applications: ${applied} (goal: ${weeklyGoal})`,
        `Interviewing: ${interviewing}`,
        `Offers: ${offers}`,
        ``,
        dueList.length ? `Follow-ups due soon:` : `No follow-ups due in the next 7 days.`,
        ...dueList.map((a) => `- ${a.company} — ${a.position} (${a.status}) on ${a.follow_up_date}`),
        ``,
        `Manage email settings in Offervia → Settings.`,
      ].join("\n");

      const html = `
        <div style="font-size:14px;color:#111827">
          <p style="margin:0 0 10px 0">Here’s your weekly summary:</p>
          <ul style="margin:0;padding-left:18px">
            <li><strong>${applied}</strong> new applications <span style="color:#6b7280">(goal: ${weeklyGoal})</span></li>
            <li><strong>${interviewing}</strong> interviewing</li>
            <li><strong>${offers}</strong> offers</li>
          </ul>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0" />
          <div style="font-weight:600;margin-bottom:6px">Follow-ups due (next 7 days)</div>
          ${
            dueList.length
              ? `<ul style="margin:0;padding-left:18px">
                  ${dueList
                    .map(
                      (a) =>
                        `<li><strong>${escapeHtml(String(a.company))}</strong> — ${escapeHtml(
                          String(a.position)
                        )} <span style="color:#6b7280">(${escapeHtml(String(a.status))})</span> on ${escapeHtml(
                          String(a.follow_up_date)
                        )}</li>`
                    )
                    .join("")}
                </ul>`
              : `<div style="color:#6b7280">No follow-ups due in the next 7 days.</div>`
          }
        </div>
      `;

      await sendUserDigestEmail({ toEmail, subject, preheader, text, html });
      sent++;
    } catch (e) {
      console.error("[weekly-digest] send failed", userId, e);
      failed++;
    }
  }

  return Response.json({ ok: true, sent, failed, total: optedIn.length });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

