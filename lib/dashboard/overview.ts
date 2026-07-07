import { hasMeaningfulJobPacketDraft, type JobPacketDraft } from "@/lib/job-packet";
import { usagePct, usageState } from "@/lib/utils";

export type DashboardNextAction = {
  title: string;
  desc: string;
  href: string;
  cta: string;
};

export type DashboardUsageItem = {
  key: "resume" | "coach" | "scan" | "interview" | "cover_letter";
  label: string;
  used: number;
  limit: number;
  pct: number;
  state: ReturnType<typeof usageState>;
  unlimited?: boolean;
};

export function getDashboardNextAction(input: {
  jobPacketDraft: JobPacketDraft | null;
  appsThisWeek: number;
  recentChatsCount: number;
}): DashboardNextAction {
  const { jobPacketDraft, appsThisWeek, recentChatsCount } = input;

  if (hasMeaningfulJobPacketDraft(jobPacketDraft) && !jobPacketDraft?.completedAt) {
    if (!jobPacketDraft?.scanResult) {
      return {
        title: "Continue your Job Packet",
        desc:
          "Your job description is already saved. Run the scan and carry that context through the rest of the flow.",
        href: "/job-packet",
        cta: "Continue packet",
      };
    }

    if (!jobPacketDraft?.tailoredResume.trim()) {
      return {
        title: "Finish tailoring this Job Packet",
        desc:
          "Your scan is ready. Open Resume Tailor with the saved company, role, and JD context.",
        href: "/job-packet",
        cta: "Continue packet",
      };
    }

    return {
      title: "Send this Job Packet to the tracker",
      desc: "Your tailored draft is ready. Finish the workflow with a prefilled tracker entry.",
      href: "/job-packet",
      cta: "Finish packet",
    };
  }

  if (appsThisWeek === 0) {
    return {
      title: "Start a Job Packet",
      desc:
        "Paste a job description once, tailor with the same context, and log the application without extra setup.",
      href: "/job-packet",
      cta: "Start packet",
    };
  }

  if (recentChatsCount === 0) {
    return {
      title: "Ask the coach a quick question",
      desc: "Practice a mock interview or tighten a resume bullet in minutes.",
      href: "/coach",
      cta: "Open Coach",
    };
  }

  return {
    title: "Run a Job Packet",
    desc: "Scan a job description, tailor, then track your application.",
    href: "/job-packet",
    cta: "Start packet",
  };
}

export function getDashboardUsageItems(input: {
  usage: {
    resumeTailor: number;
    coachMessages: number;
    jobScans: number;
    interviewSessions: number;
    coverLetters: number;
  };
  limits: {
    resume_tailor_per_month: number;
    coach_messages_per_month: number;
    job_scans_per_month: number;
    interview_sessions_per_month: number;
    cover_letters_per_month: number;
  };
}): DashboardUsageItem[] {
  const { usage, limits } = input;
  const UNLIMITED_THRESHOLD = 9999;
  const interviewUnlimited = limits.interview_sessions_per_month >= UNLIMITED_THRESHOLD;

  return [
    {
      key: "resume",
      label: "Resume Tailors",
      used: usage.resumeTailor,
      limit: limits.resume_tailor_per_month,
      pct: usagePct(usage.resumeTailor, limits.resume_tailor_per_month),
      state: usageState(usagePct(usage.resumeTailor, limits.resume_tailor_per_month)),
    },
    {
      key: "coach",
      label: "AI Coach",
      used: usage.coachMessages,
      limit: limits.coach_messages_per_month,
      pct: usagePct(usage.coachMessages, limits.coach_messages_per_month),
      state: usageState(usagePct(usage.coachMessages, limits.coach_messages_per_month)),
    },
    {
      key: "scan",
      label: "Job Scans",
      used: usage.jobScans,
      limit: limits.job_scans_per_month,
      pct: usagePct(usage.jobScans, limits.job_scans_per_month),
      state: usageState(usagePct(usage.jobScans, limits.job_scans_per_month)),
    },
    {
      key: "interview",
      label: "Mock Interviews",
      used: usage.interviewSessions,
      limit: limits.interview_sessions_per_month,
      pct: interviewUnlimited
        ? 0
        : usagePct(usage.interviewSessions, limits.interview_sessions_per_month),
      state: interviewUnlimited
        ? "low"
        : usageState(usagePct(usage.interviewSessions, limits.interview_sessions_per_month)),
      unlimited: interviewUnlimited,
    },
    {
      key: "cover_letter",
      label: "Cover Letters",
      used: usage.coverLetters,
      limit: limits.cover_letters_per_month,
      pct: usagePct(usage.coverLetters, limits.cover_letters_per_month),
      state: usageState(usagePct(usage.coverLetters, limits.cover_letters_per_month)),
    },
  ];
}
