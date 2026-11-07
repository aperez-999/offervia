/**
 * Side-by-side job offer math. Everything is before taxes: tax depends on
 * where you live and file, so we don't guess at it and say so in the UI.
 */

export type Offer = {
  id: string;
  label: string;
  /** Yearly base salary. */
  base: number;
  /** Expected yearly bonus in dollars (target, not guaranteed). */
  bonus: number;
  /** One-time signing bonus. */
  signing: number;
  /** Paid days off per year, holidays not included. */
  ptoDays: number;
  /** One-way commute in minutes. */
  commuteMinutes: number;
  /** Days per week in the office. */
  officeDays: number;
  /** Monthly rent where you'd live for this job. */
  rent: number;
};

export type OfferResult = {
  id: string;
  /** Base + bonus + signing in the first year. */
  firstYear: number;
  /** Base + bonus every year after. */
  yearly: number;
  /** Yearly pay per month, before taxes. */
  monthly: number;
  /** Monthly pay minus rent, before taxes. */
  afterRent: number;
  /** Hours a year spent commuting (round trip). */
  commuteHours: number;
  /** Yearly pay divided by working hours plus commute hours. */
  realHourly: number;
};

export type Metric = "firstYear" | "yearly" | "afterRent" | "commuteHours" | "realHourly";

const WEEKS_PER_YEAR = 52;
const HOURS_PER_DAY = 8;
const HOLIDAY_DAYS = 10;

function n(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function emptyOffer(id: string, label: string): Offer {
  return { id, label, base: 0, bonus: 0, signing: 0, ptoDays: 15, commuteMinutes: 0, officeDays: 5, rent: 0 };
}

export function evaluateOffer(o: Offer): OfferResult {
  const yearly = n(o.base) + n(o.bonus);
  const daysOff = Math.min(n(o.ptoDays) + HOLIDAY_DAYS, 5 * WEEKS_PER_YEAR);
  const workDays = 5 * WEEKS_PER_YEAR - daysOff;
  const officeShare = Math.min(n(o.officeDays), 5) / 5;
  const commuteHours = Math.round(((n(o.commuteMinutes) * 2) / 60) * workDays * officeShare);
  const workHours = workDays * HOURS_PER_DAY;
  const monthly = yearly / 12;
  return {
    id: o.id,
    firstYear: yearly + n(o.signing),
    yearly,
    monthly,
    afterRent: monthly - n(o.rent),
    commuteHours,
    realHourly: workHours + commuteHours > 0 ? yearly / (workHours + commuteHours) : 0,
  };
}

const LOWER_IS_BETTER: Record<Metric, boolean> = {
  firstYear: false,
  yearly: false,
  afterRent: false,
  commuteHours: true,
  realHourly: false,
};

/**
 * Which offer wins each metric. Ties and offers with no pay entered don't
 * win anything, so an empty column never shows as "best".
 */
export function bestByMetric(results: OfferResult[]): Partial<Record<Metric, string>> {
  const filled = results.filter((r) => r.yearly > 0);
  const best: Partial<Record<Metric, string>> = {};
  if (filled.length < 2) return best;
  for (const metric of Object.keys(LOWER_IS_BETTER) as Metric[]) {
    const lower = LOWER_IS_BETTER[metric];
    const sorted = [...filled].sort((a, b) => (lower ? a[metric] - b[metric] : b[metric] - a[metric]));
    if (sorted[0][metric] !== sorted[1][metric]) best[metric] = sorted[0].id;
  }
  return best;
}

/** Parse a money-ish input like "$85,000" or "85k". Returns 0 for anything else. */
export function parseAmount(input: string): number {
  const s = input.trim().toLowerCase().replace(/[$,\s]/g, "");
  const m = s.match(/^(\d+(?:\.\d+)?)(k)?$/);
  if (!m) return 0;
  return Math.round(Number(m[1]) * (m[2] ? 1000 : 1));
}
