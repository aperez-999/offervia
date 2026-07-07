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
  const got =
    req.headers.get("x-cron-secret") || new URL(req.url).searchParams.get("secret");
  return got === secret;
}

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Daily follow-up reminder: emails opted-in users about applications whose
// follow_up_date is today or overdue, so nothing slips through. Complements the
// weekly digest (which only looks ahead 7 days). Users with nothing due are skipped.
export async function POST(req: Request) {
  if (!requireCronAuth(req)) {
    return fail("UNAUTHORIZED", "Unauthorized", 401);
  }

  const supabase = getServiceSupabase();

  // Opt-in is a dedicated flag (separate from the weekly email digest). If the
  // column hasn't been migrated yet, fail safe: send nothing rather than 500.
  const { data: prefs, error: prefsErr } = await supabase
    .from("user_prefs")
    .select("user_id,daily_reminders")
    .eq("daily_reminders", true);

  if (prefsErr) {
    console.error("[follow-up-reminders] prefs query failed", prefsErr);
    return Response.json({
      ok: true,
      sent: 0,
      failed: 0,
      skipped: 0,
      total: 0,
      note: "daily_reminders column unavailable — run db/daily_reminders_pref.sql",
    });
  }

  const optedIn = (prefs ?? []).filter((p) => p?.user_id);
  const todayIso = isoDate(new Date());

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const p of optedIn) {
    const userId = p.user_id as string;
    try {
      // Applications due today or overdue, still active (not closed out).
      const { data: due } = await supabase
        .from("applications")
        .select("company,position,follow_up_date,status")
        .eq("user_id", userId)
        .not("follow_up_date", "is", null)
        .lte("follow_up_date", todayIso)
        .in("status", ["Applied", "Interviewing"])
        .order("follow_up_date", { ascending: true });

      const dueList = (due ?? []).slice(0, 12);
      if (dueList.length === 0) {
        skipped++;
        continue;
      }

      const { data: userRes, error: userErr } =
        await supabase.auth.admin.getUserById(userId);
      const toEmail = userRes?.user?.email;
      if (userErr || !toEmail) {
        failed++;
        continue;
      }

      const overdue = dueList.filter(
        (a) => String(a.follow_up_date) < todayIso,
      ).length;
      const dueToday = dueList.length - overdue;

      const subject =
        overdue > 0
          ? `${dueList.length} follow-up${dueList.length === 1 ? "" : "s"} need attention`
          : `${dueList.length} follow-up${dueList.length === 1 ? "" : "s"} due today`;
      const preheader =
        overdue > 0
          ? `${overdue} overdue • ${dueToday} due today`
          : `${dueToday} due today`;

      const text = [
        `Offervia follow-up reminders`,
        ``,
        overdue > 0 ? `${overdue} overdue, ${dueToday} due today.` : `${dueToday} due today.`,
        ``,
        ...dueList.map((a) => {
          const late = String(a.follow_up_date) < todayIso ? " (overdue)" : "";
          return `- ${a.company} — ${a.position} (${a.status}) on ${a.follow_up_date}${late}`;
        }),
        ``,
        `Open Offervia → Tracker to update these.`,
        `Manage email settings in Offervia → Settings.`,
      ].join("\n");

      const rows = dueList
        .map((a) => {
          const late = String(a.follow_up_date) < todayIso;
          const badge = late
            ? `<span style="color:#b91c1c;font-weight:600">overdue</span>`
            : `<span style="color:#2563eb;font-weight:600">today</span>`;
          return `<li style="margin-bottom:4px"><strong>${escapeHtml(
            String(a.company),
          )}</strong> — ${escapeHtml(String(a.position))} <span style="color:#6b7280">(${escapeHtml(
            String(a.status),
          )})</span> · ${escapeHtml(String(a.follow_up_date))} · ${badge}</li>`;
        })
        .join("");

      const html = `
        <div style="font-size:14px;color:#111827">
          <p style="margin:0 0 10px 0">These applications are waiting on a follow-up:</p>
          <ul style="margin:0;padding-left:18px">${rows}</ul>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:14px 0" />
          <div style="color:#6b7280">Update their status in your Offervia tracker to keep momentum.</div>
        </div>
      `;

      await sendUserDigestEmail({
        toEmail,
        subject,
        preheader,
        subtitle: "Follow-up reminders",
        text,
        html,
      });
      sent++;
    } catch (e) {
      console.error("[follow-up-reminders] send failed", userId, e);
      failed++;
    }
  }

  return Response.json({
    ok: true,
    sent,
    failed,
    skipped,
    total: optedIn.length,
  });
}
