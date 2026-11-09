import { hasMeaningfulJobPacketDraft, type JobPacketDraft } from "@/lib/job-packet";

export type DashboardNextAction = {
  title: string;
  desc: string;
  href: string;
  cta: string;
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
        title: "Finish your application",
        desc:
          "Your job description is saved. Run the scan next.",
        href: "/job-packet",
        cta: "Continue",
      };
    }

    if (!jobPacketDraft?.tailoredResume.trim()) {
      return {
        title: "Fit your resume to this job",
        desc:
          "Your scan is done. Next, tailor your resume using the same job description.",
        href: "/job-packet",
        cta: "Continue",
      };
    }

    return {
      title: "Add this job to your tracker",
      desc: "Your tailored resume is ready. Add the application to your tracker to finish.",
      href: "/job-packet",
      cta: "Finish",
    };
  }

  if (appsThisWeek === 0) {
    return {
      title: "Start a new application",
      desc:
        "Paste a job posting, see what your resume is missing, and add the job to your tracker.",
      href: "/job-packet",
      cta: "Start",
    };
  }

  if (recentChatsCount === 0) {
    return {
      title: "Ask the coach a question",
      desc: "Run a practice interview or get feedback on a resume bullet.",
      href: "/coach",
      cta: "Open Coach",
    };
  }

  return {
    title: "Start a new application",
    desc: "Paste a posting, fit your resume, and track it.",
    href: "/job-packet",
    cta: "Start",
  };
}

export type DashboardStatus = "Applied" | "Interviewing" | "Offer" | "Rejected";

export type DashboardApp = {
  id: string;
  company: string;
  position: string;
  status: DashboardStatus;
  applied_on: string;
  follow_up_date?: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

/** Counts for the "Your search" card. */
export function summarizeApplications(apps: DashboardApp[], now: Date = new Date()) {
  const weekAgo = now.getTime() - 7 * DAY_MS;
  return {
    total: apps.length,
    applied: apps.filter((a) => a.status === "Applied").length,
    interviewing: apps.filter((a) => a.status === "Interviewing").length,
    offers: apps.filter((a) => a.status === "Offer").length,
    thisWeek: apps.filter((a) => a.applied_on && Date.parse(a.applied_on) >= weekAgo).length,
  };
}

/** Share of applications that heard back, reached interviews, and became offers. */
export function applicationRates(apps: DashboardApp[]) {
  const pct = (n: number) => (apps.length > 0 ? Math.round((n / apps.length) * 100) : 0);
  const count = (s: DashboardStatus) => apps.filter((a) => a.status === s).length;
  return {
    responseRate: pct(count("Interviewing") + count("Offer") + count("Rejected")),
    interviewRate: pct(count("Interviewing")),
    offerRate: pct(count("Offer")),
  };
}

/**
 * Open applications whose follow-up date is today or earlier, oldest first.
 * `today` is a YYYY-MM-DD string in the reader's own calendar.
 */
export function dueFollowUps(apps: DashboardApp[], today: string) {
  return apps
    .filter(
      (a) =>
        (a.status === "Applied" || a.status === "Interviewing") &&
        typeof a.follow_up_date === "string" &&
        a.follow_up_date.slice(0, 10) <= today
    )
    .sort((a, b) => String(a.follow_up_date).localeCompare(String(b.follow_up_date)))
    .map((app) => {
      const due = String(app.follow_up_date).slice(0, 10);
      const days = Math.round((Date.parse(today) - Date.parse(due)) / DAY_MS);
      return { app, label: days <= 0 ? "Follow up today" : days === 1 ? "1 day overdue" : `${days} days overdue` };
    });
}

/** Today's date as YYYY-MM-DD in local time (not UTC). */
export function localIsoDate(now: Date = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
