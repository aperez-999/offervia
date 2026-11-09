import { describe, expect, it } from "vitest";
import { createEmptyJobPacketDraft } from "@/lib/job-packet";
import {
  applicationRates,
  dueFollowUps,
  getDashboardNextAction,
  localIsoDate,
  summarizeApplications,
  type DashboardApp,
} from "@/lib/dashboard/overview";

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
      cta: "Start",
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
      title: "Finish your application",
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

const app = (over: Partial<DashboardApp>): DashboardApp => ({
  id: Math.random().toString(36).slice(2),
  company: "Acme",
  position: "Analyst",
  status: "Applied",
  applied_on: "2026-11-01",
  ...over,
});

describe("summarizeApplications", () => {
  it("counts statuses and this week's applications", () => {
    const now = new Date("2026-11-04T12:00:00Z");
    const s = summarizeApplications(
      [
        app({ applied_on: "2026-11-03" }),
        app({ status: "Interviewing", applied_on: "2026-10-01" }),
        app({ status: "Offer", applied_on: "2026-10-30" }),
        app({ status: "Rejected", applied_on: "" }),
      ],
      now
    );
    expect(s).toEqual({ total: 4, applied: 1, interviewing: 1, offers: 1, thisWeek: 2 });
  });
});

describe("applicationRates", () => {
  it("is zero with no applications", () => {
    expect(applicationRates([])).toEqual({ responseRate: 0, interviewRate: 0, offerRate: 0 });
  });

  it("counts any reply, including rejections, as a response", () => {
    const r = applicationRates([app({}), app({ status: "Rejected" }), app({ status: "Interviewing" }), app({ status: "Offer" })]);
    expect(r).toEqual({ responseRate: 75, interviewRate: 25, offerRate: 25 });
  });
});

describe("dueFollowUps", () => {
  it("lists open applications due today or earlier, oldest first", () => {
    const due = dueFollowUps(
      [
        app({ company: "Later", follow_up_date: "2026-11-09" }),
        app({ company: "Today", follow_up_date: "2026-11-04" }),
        app({ company: "Old", follow_up_date: "2026-11-01" }),
        app({ company: "Closed", status: "Rejected", follow_up_date: "2026-11-01" }),
        app({ company: "None", follow_up_date: null }),
      ],
      "2026-11-04"
    );
    expect(due.map((d) => [d.app.company, d.label])).toEqual([
      ["Old", "3 days overdue"],
      ["Today", "Follow up today"],
    ]);
  });
});

describe("localIsoDate", () => {
  it("formats in local time", () => {
    expect(localIsoDate(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});
