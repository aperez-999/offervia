import { describe, expect, it } from "vitest";
import { bestByMetric, emptyOffer, evaluateOffer, parseAmount, type Offer } from "@/lib/offers/compare";

const offer = (over: Partial<Offer>): Offer => ({ ...emptyOffer("a", "A"), ...over });

describe("evaluateOffer", () => {
  it("adds signing to the first year only", () => {
    const r = evaluateOffer(offer({ base: 80000, bonus: 5000, signing: 10000 }));
    expect(r.firstYear).toBe(95000);
    expect(r.yearly).toBe(85000);
    expect(r.monthly).toBeCloseTo(85000 / 12);
  });

  it("subtracts rent from monthly pay", () => {
    const r = evaluateOffer(offer({ base: 72000, rent: 1800 }));
    expect(r.afterRent).toBe(6000 - 1800);
  });

  it("counts round-trip commute only on office days", () => {
    // 30 min each way, 5 days, 15 PTO + 10 holidays = 235 work days
    const full = evaluateOffer(offer({ base: 1, commuteMinutes: 30, officeDays: 5, ptoDays: 15 }));
    expect(full.commuteHours).toBe(235);
    const hybrid = evaluateOffer(offer({ base: 1, commuteMinutes: 30, officeDays: 2, ptoDays: 15 }));
    expect(hybrid.commuteHours).toBe(94);
  });

  it("lowers the real hourly rate when the commute is long", () => {
    const remote = evaluateOffer(offer({ base: 90000, officeDays: 0, commuteMinutes: 45 }));
    const office = evaluateOffer(offer({ base: 90000, officeDays: 5, commuteMinutes: 45 }));
    expect(remote.realHourly).toBeGreaterThan(office.realHourly);
  });

  it("treats blank or negative numbers as zero", () => {
    const r = evaluateOffer(offer({ base: Number.NaN, bonus: -5, rent: -100 }));
    expect(r).toMatchObject({ yearly: 0, firstYear: 0, afterRent: 0, realHourly: 0 });
  });
});

describe("bestByMetric", () => {
  it("picks a winner per metric and skips ties", () => {
    const a = evaluateOffer(offer({ id: "a", base: 90000, rent: 2500, commuteMinutes: 40 }));
    const b = evaluateOffer(offer({ id: "b", base: 80000, rent: 1200, commuteMinutes: 40 }));
    const best = bestByMetric([a, b]);
    expect(best.yearly).toBe("a");
    expect(best.afterRent).toBe("b");
    expect(best.commuteHours).toBeUndefined();
  });

  it("needs at least two offers with pay", () => {
    const a = evaluateOffer(offer({ id: "a", base: 90000 }));
    const empty = evaluateOffer(offer({ id: "b" }));
    expect(bestByMetric([a, empty])).toEqual({});
  });
});

describe("parseAmount", () => {
  it("reads common money formats", () => {
    expect(parseAmount("$85,000")).toBe(85000);
    expect(parseAmount("85k")).toBe(85000);
    expect(parseAmount("72.5K")).toBe(72500);
    expect(parseAmount("abc")).toBe(0);
    expect(parseAmount("")).toBe(0);
  });
});
