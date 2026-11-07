/**
 * Daily allowances for the AI tools. Everyone gets the same numbers.
 *
 * The real ceiling is the shared Groq account (requests and tokens per minute
 * and per day across all users), so these caps exist to keep one person from
 * using everyone's share, not to sell anything. Each window is a rolling 24
 * hours: a use frees up again exactly a day after it happened.
 *
 * Safe to import from client components (no server dependencies).
 */

export type GatedFeature =
  | "resume_tailor"
  | "cover_letter"
  | "job_scan"
  | "interview_session"
  | "coach";

export const DAILY_LIMITS: Record<GatedFeature, number> = {
  resume_tailor: 8,
  cover_letter: 8,
  job_scan: 25,
  interview_session: 5,
  coach: 40,
};

export const ALLOWANCE_WINDOW_MS = 24 * 60 * 60 * 1000;

/** Display order and wording for dashboard and settings. */
export const FEATURE_COPY: Record<GatedFeature, { label: string; unit: string }> = {
  resume_tailor: { label: "Resume tailoring", unit: "resume drafts" },
  cover_letter: { label: "Cover letters", unit: "cover letters" },
  job_scan: { label: "Job scans", unit: "job scans" },
  interview_session: { label: "Mock interviews", unit: "mock interviews" },
  coach: { label: "Coach messages", unit: "coach messages" },
};

export const GATED_FEATURES = Object.keys(DAILY_LIMITS) as GatedFeature[];

/** Kind stored in request_events for one successful use of a feature. */
export function allowanceKind(feature: GatedFeature) {
  return `allowance:${feature}`;
}

export type AllowanceStatus = {
  used: number;
  remaining: number;
  limit: number;
  /** When the next use frees up. Null while there is room left. */
  resetsAt: Date | null;
};

/** Same as AllowanceStatus, but safe to pass from a server to a client component. */
export type AllowanceSnapshot = Omit<AllowanceStatus, "resetsAt"> & { resetsAt: string | null };

export function toSnapshot(status: AllowanceStatus): AllowanceSnapshot {
  return { ...status, resetsAt: status.resetsAt?.toISOString() ?? null };
}

/**
 * Work out what is left from the timestamps of past uses. Uses older than the
 * window are ignored, so callers can pass a loose superset.
 */
export function allowanceStatus(
  usedAt: ReadonlyArray<string | Date>,
  limit: number,
  now: Date = new Date()
): AllowanceStatus {
  const cutoff = now.getTime() - ALLOWANCE_WINDOW_MS;
  const inWindow = usedAt
    .map((t) => (t instanceof Date ? t.getTime() : Date.parse(t)))
    .filter((ms) => Number.isFinite(ms) && ms > cutoff)
    .sort((a, b) => a - b);

  const used = inWindow.length;
  const remaining = Math.max(0, limit - used);

  // When full, the slot that frees first belongs to the use that will drop
  // out of the window first: the (used - limit + 1)th oldest.
  const resetsAt =
    remaining > 0 || used === 0
      ? null
      : new Date(inWindow[used - limit] + ALLOWANCE_WINDOW_MS);

  return { used, remaining, limit, resetsAt };
}

/** "at 3:40 PM" or "tomorrow at 9:15 AM", in the reader's time zone by default. */
export function formatResetTime(
  resetsAt: string | Date,
  opts: { now?: Date; timeZone?: string } = {}
) {
  const when = new Date(resetsAt);
  const now = opts.now ?? new Date();
  const time = when.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: opts.timeZone,
  });
  const sameDay =
    when.toLocaleDateString("en-US", { timeZone: opts.timeZone }) ===
    now.toLocaleDateString("en-US", { timeZone: opts.timeZone });
  return sameDay ? `at ${time}` : `tomorrow at ${time}`;
}

/** Message shown when a limit is hit. */
export function limitReachedMessage(
  feature: GatedFeature,
  resetsAt: Date | string | null | undefined,
  opts: { now?: Date; timeZone?: string } = {}
) {
  const base = `You've used today's ${DAILY_LIMITS[feature]} ${FEATURE_COPY[feature].unit}.`;
  const when = resetsAt ? new Date(resetsAt) : null;
  if (!when || Number.isNaN(when.getTime())) {
    return `${base} More open up within 24 hours.`;
  }
  return `${base} Your next one frees up ${formatResetTime(when, opts)}.`;
}

export function isGatedFeature(value: unknown): value is GatedFeature {
  return typeof value === "string" && value in DAILY_LIMITS;
}

/** How many left before a note shows up next to a tool's button. */
export const LOW_REMAINING = 3;

/**
 * The note to show next to a tool's button, or null when there's plenty
 * left. At zero it explains when the next use frees up.
 */
export function remainingNote(
  feature: GatedFeature,
  remaining: number,
  resetsAt: string | Date | null,
  opts: { now?: Date; timeZone?: string } = {}
): string | null {
  if (remaining > LOW_REMAINING) return null;
  if (remaining <= 0) return limitReachedMessage(feature, resetsAt, opts);
  return `${remaining} left today`;
}
