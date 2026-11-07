import { describe, expect, it } from "vitest";
import { checkBullets, detectTense, splitBullets } from "@/lib/bullets/check";

const kinds = (text: string) => checkBullets(text).bullets[0].issues.map((i) => i.kind);

describe("splitBullets", () => {
  it("strips list markers and blank lines", () => {
    expect(splitBullets("• Built a thing\n\n- Led a team\n3. Cut costs\n  * Grew sales")).toEqual([
      "Built a thing",
      "Led a team",
      "Cut costs",
      "Grew sales",
    ]);
  });
});

describe("checkBullets", () => {
  it("passes a strong bullet", () => {
    const r = checkBullets("Built a React dashboard that cut onboarding time by 30% for 2,000 users");
    expect(r.bullets[0].issues).toEqual([]);
    expect(r.bullets[0].verdict).toBe("strong");
    expect(r.strong).toBe(1);
  });

  it("flags weak openers and marks the phrase", () => {
    const r = checkBullets("Responsible for managing the front desk schedule for 12 staff");
    const issue = r.bullets[0].issues.find((i) => i.kind === "weak-opener");
    expect(issue?.spans).toEqual([[0, "Responsible for".length]]);
    expect(r.bullets[0].verdict).toBe("needs-work");
  });

  it("does not treat 'helpful' as the opener 'helped'", () => {
    expect(kinds("Helpful guides written for 40 new tutors each semester")).not.toContain("weak-opener");
  });

  it("flags missing numbers but accepts number words", () => {
    expect(kinds("Organized the spring career fair for engineering students")).toContain("no-number");
    expect(kinds("Organized dozens of career events for engineering students")).not.toContain("no-number");
  });

  it("flags first person pronouns but not words that contain them", () => {
    const r = checkBullets("I trained my team of 5 cashiers on the new system");
    const issue = r.bullets[0].issues.find((i) => i.kind === "first-person");
    expect(issue?.spans.length).toBe(2);
    expect(kinds("Mentored 5 interns on testing and myriad tools")).not.toContain("first-person");
  });

  it("flags filler words", () => {
    const r = checkBullets("Successfully utilized various tools to ship 3 features");
    const issue = r.bullets[0].issues.find((i) => i.kind === "filler");
    expect(issue?.spans.length).toBe(3);
  });

  it("flags bullets that are too long or too short", () => {
    const long = "Built " + Array.from({ length: 34 }, (_, i) => `word${i}`).join(" ") + " 10";
    expect(kinds(long)).toContain("too-long");
    expect(kinds("Cut costs 10%")).toContain("too-short");
  });

  it("flags the odd tense out only when the list clearly leans one way", () => {
    const r = checkBullets(
      ["Built 3 internal tools for 40 staff", "Led a team of 4 on a 6 week launch", "Manage the 2 person support inbox daily"].join("\n")
    );
    expect(r.bullets[2].issues.map((i) => i.kind)).toContain("tense");
    expect(r.bullets[0].issues.map((i) => i.kind)).not.toContain("tense");

    const even = checkBullets("Built 3 tools for 40 staff members\nManage the 2 person support inbox daily");
    expect(even.bullets.flatMap((b) => b.issues).map((i) => i.kind)).not.toContain("tense");
  });

  it("counts issues across bullets", () => {
    const r = checkBullets("Helped with stuff\nWorked on things");
    expect(r.counts["weak-opener"]).toBe(2);
    expect(r.needsWork).toBe(2);
  });
});

describe("detectTense", () => {
  it("reads past, present, and unknown openers", () => {
    expect(detectTense("Shipped a feature")).toBe("past");
    expect(detectTense("Led a team")).toBe("past");
    expect(detectTense("Manages a team")).toBe("present");
    expect(detectTense("Customer-facing role")).toBe("unknown");
  });
});
