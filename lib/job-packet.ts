export const JOB_PACKET_DRAFT_KEY = "offervia:jobPacketDraft_v1";

export type JobPacketStatus =
  | "details"
  | "scan"
  | "resume"
  | "tracker"
  | "complete";

export type JobPacketScanResult = {
  match_score: number;
  strengths: string[];
  missing_skills: string[];
  summary: string;
};

export type JobPacketTrackerDraft = {
  company: string;
  position: string;
  status: "Applied" | "Interviewing" | "Offer" | "Rejected";
  applied_on: string;
};

export type JobPacketDraft = {
  version: 1;
  updatedAt: string;
  currentStep: JobPacketStatus;
  jobDescription: string;
  companyName: string;
  roleTitle: string;
  location: string;
  companyUrl: string;
  scanResult: JobPacketScanResult | null;
  tailoredResume: string;
  resumeFileName: string;
  trackerDraft: JobPacketTrackerDraft | null;
  completedAt: string | null;
};

export function createEmptyJobPacketDraft(): JobPacketDraft {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    currentStep: "details",
    jobDescription: "",
    companyName: "",
    roleTitle: "",
    location: "",
    companyUrl: "",
    scanResult: null,
    tailoredResume: "",
    resumeFileName: "",
    trackerDraft: null,
    completedAt: null,
  };
}

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function sanitizeString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function sanitizeScanResult(value: unknown): JobPacketScanResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Record<string, unknown>;
  if (
    typeof result.match_score !== "number" ||
    !Array.isArray(result.strengths) ||
    !Array.isArray(result.missing_skills) ||
    typeof result.summary !== "string"
  ) {
    return null;
  }

  return {
    match_score: result.match_score,
    strengths: result.strengths.map((item) => String(item)),
    missing_skills: result.missing_skills.map((item) => String(item)),
    summary: result.summary,
  };
}

function sanitizeTrackerDraft(value: unknown): JobPacketTrackerDraft | null {
  if (!value || typeof value !== "object") return null;
  const tracker = value as Record<string, unknown>;
  const status = sanitizeString(tracker.status);
  if (!status) return null;

  return {
    company: sanitizeString(tracker.company),
    position: sanitizeString(tracker.position),
    status:
      status === "Interviewing" || status === "Offer" || status === "Rejected"
        ? status
        : "Applied",
    applied_on: sanitizeString(tracker.applied_on),
  };
}

function normalizePacketStep(value: unknown): JobPacketStatus {
  switch (value) {
    case "scan":
    case "resume":
    case "tracker":
    case "complete":
      return value;
    default:
      return "details";
  }
}

export function normalizeJobPacketDraft(value: unknown): JobPacketDraft {
  const empty = createEmptyJobPacketDraft();
  if (!value || typeof value !== "object") return empty;

  const draft = value as Record<string, unknown>;
  return {
    version: 1,
    updatedAt: sanitizeString(draft.updatedAt) || empty.updatedAt,
    currentStep: normalizePacketStep(draft.currentStep),
    jobDescription: sanitizeString(draft.jobDescription),
    companyName: sanitizeString(draft.companyName),
    roleTitle: sanitizeString(draft.roleTitle),
    location: sanitizeString(draft.location),
    companyUrl: sanitizeString(draft.companyUrl),
    scanResult: sanitizeScanResult(draft.scanResult),
    tailoredResume: sanitizeString(draft.tailoredResume),
    resumeFileName: sanitizeString(draft.resumeFileName),
    trackerDraft: sanitizeTrackerDraft(draft.trackerDraft),
    completedAt: sanitizeString(draft.completedAt) || null,
  };
}

export function readJobPacketDraft(): JobPacketDraft | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(JOB_PACKET_DRAFT_KEY);
    if (!raw) return null;
    return normalizeJobPacketDraft(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function writeJobPacketDraft(draft: JobPacketDraft) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(
      JOB_PACKET_DRAFT_KEY,
      JSON.stringify({
        ...draft,
        version: 1,
        updatedAt: new Date().toISOString(),
      })
    );
  } catch {
    // noop
  }
}

export function mergeJobPacketDraft(
  current: JobPacketDraft | null,
  updates: Partial<JobPacketDraft>
): JobPacketDraft {
  return {
    ...(current ?? createEmptyJobPacketDraft()),
    ...updates,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
}

export function updateJobPacketDraft(updates: Partial<JobPacketDraft>) {
  const next = mergeJobPacketDraft(readJobPacketDraft(), updates);
  writeJobPacketDraft(next);
  return next;
}

export function clearJobPacketDraft() {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(JOB_PACKET_DRAFT_KEY);
  } catch {
    // noop
  }
}

export function hasMeaningfulJobPacketDraft(draft: JobPacketDraft | null) {
  if (!draft) return false;
  return Boolean(
    draft.jobDescription.trim() ||
      draft.companyName.trim() ||
      draft.roleTitle.trim() ||
      draft.tailoredResume.trim() ||
      draft.scanResult
  );
}

export function buildTrackerDraftFromPacket(draft: Pick<JobPacketDraft, "companyName" | "roleTitle">) {
  return {
    company: draft.companyName.trim(),
    position: draft.roleTitle.trim(),
    status: "Applied" as const,
    applied_on: new Date().toISOString().slice(0, 10),
  };
}
