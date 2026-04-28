export type ApplicationStatus = "Applied" | "Interviewing" | "Offer" | "Rejected";

export type Application = {
  id: string;
  user_id: string;
  company: string;
  position: string;
  role: string;
  status: ApplicationStatus;
  applied_on: string;
  follow_up_date: string;
  created_at: string;
};

export type TrackerApiRow = {
  id: string;
  user_id: string;
  company: string;
  role?: string | null;
  position?: string | null;
  status: ApplicationStatus;
  applied_on?: string | null;
  follow_up_date?: string | null;
  created_at: string;
};

export const TRACKER_STATUS_OPTIONS = ["Applied", "Interviewing", "Offer", "Rejected"] as const;
export const TRACKER_PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const TRACKER_PREFS_KEY = "offervia:trackerPrefs_v1";

export type SortKey = "company" | "position" | "status" | "applied_on";
export type SortDir = "asc" | "desc";

export function formatTrackerDate(value: string | null | undefined) {
  if (!value) return "";
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toISOString().slice(0, 10);
  } catch {
    return String(value);
  }
}

export function normalizeApplication(row: TrackerApiRow): Application {
  const position = row.position?.trim() || row.role?.trim() || "";
  const appliedOn = formatTrackerDate(row.applied_on || row.follow_up_date);

  return {
    id: row.id,
    user_id: row.user_id,
    company: row.company,
    position,
    role: position,
    status: row.status,
    applied_on: appliedOn,
    follow_up_date: appliedOn,
    created_at: row.created_at,
  };
}

export function nextApplicationStatus(value: ApplicationStatus): ApplicationStatus {
  const index = TRACKER_STATUS_OPTIONS.indexOf(value);
  return TRACKER_STATUS_OPTIONS[(index + 1) % TRACKER_STATUS_OPTIONS.length];
}
