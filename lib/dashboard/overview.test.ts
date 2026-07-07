import { describe, expect, it } from "vitest";
import { createEmptyJobPacketDraft } from "@/lib/job-packet";
import { getDashboardNextAction, getDashboardUsageItems } from "@/lib/dashboard/overview";

describe("getDashboardNextAction", () => {
  it("guides a new user into Job Packet", () => {
    expect(
      getDashboardNextAction({
        jobPacketDraft: null,
        appsThisWeek: 0,
        recentChatsCount: 0,
      })
    ).toMatchObject({
      href: "/job-packet",
      cta: "Start packet",
    });
  });

  it("continues an in-progress packet before anything else", () => {
    const draft = createEmptyJobPacketDraft();
    draft.jobDescription = "Senior frontend engineer role with React and TypeScript";

    expect(
      getDashboardNextAction({
        jobPacketDraft: draft,
        appsThisWeek: 2,
        recentChatsCount: 3,
      })
    ).toMatchObject({
      title: "Continue your Job Packet",
      href: "/job-packet",
    });
  });

  it("prompts coaching only when packet and first-week activation are already handled", () => {
    expect(
      getDashboardNextAction({
        jobPacketDraft: null,
        appsThisWeek: 3,
        recentChatsCount: 0,
      })
    ).toMatchObject({
      href: "/coach",
      cta: "Open Coach",
    });
  });
});

describe("getDashboardUsageItems", () => {
  it("builds usage rows with threshold states", () => {
    const items = getDashboardUsageItems({
      usage: {
        resumeTailor: 7,
        coachMessages: 10,
        jobScans: 2,
        interviewSessions: 1,
        coverLetters: 0,
      },
      limits: {
        resume_tailor_per_month: 10,
        coach_messages_per_month: 10,
        job_scans_per_month: 20,
        interview_sessions_per_month: 5,
        cover_letters_per_month: 3,
      },
    });

    expect(items.map((item) => item.label)).toEqual([
      "Resume Tailors",
      "AI Coach",
      "Job Scans",
      "Mock Interviews",
      "Cover Letters",
    ]);
    expect(items[0].state).toBe("warn");
    expect(items[1].state).toBe("high");
    expect(items[2].state).toBe("low");
    expect(items[3].state).toBe("low");
  });

  it("marks an effectively-unlimited interview limit as unlimited", () => {
    const items = getDashboardUsageItems({
      usage: { resumeTailor: 0, coachMessages: 0, jobScans: 0, interviewSessions: 3, coverLetters: 0 },
      limits: {
        resume_tailor_per_month: 150,
        coach_messages_per_month: 1000,
        job_scans_per_month: 300,
        interview_sessions_per_month: 999999,
        cover_letters_per_month: 100,
      },
    });
    const interview = items.find((item) => item.key === "interview");
    expect(interview?.unlimited).toBe(true);
    expect(interview?.pct).toBe(0);
  });
});
