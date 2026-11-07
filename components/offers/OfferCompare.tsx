"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, Plus, Trash } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  bestByMetric,
  evaluateOffer,
  parseAmount,
  type Metric,
  type Offer,
  type OfferResult,
} from "@/lib/offers/compare";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "offervia:offers:draft_v1";
const MAX_OFFERS = 3;

/** Inputs are kept as typed text so "85k" or "$85,000" both work. */
type Draft = {
  id: string;
  label: string;
  base: string;
  bonus: string;
  signing: string;
  ptoDays: string;
  commuteMinutes: string;
  officeDays: string;
  rent: string;
};

// Starting offers need stable ids so server and client render the same HTML.
const newDraft = (n: number, id = `offer-${n}`): Draft => ({
  id,
  label: "",
  base: "",
  bonus: "",
  signing: "",
  ptoDays: "15",
  commuteMinutes: "",
  officeDays: "5",
  rent: "",
});

function toOffer(d: Draft, index: number): Offer {
  const num = (s: string) => {
    const v = Number(s.replace(/[^\d.]/g, ""));
    return Number.isFinite(v) ? v : 0;
  };
  return {
    id: d.id,
    label: d.label.trim() || `Offer ${String.fromCharCode(65 + index)}`,
    base: parseAmount(d.base),
    bonus: parseAmount(d.bonus),
    signing: parseAmount(d.signing),
    ptoDays: num(d.ptoDays),
    commuteMinutes: num(d.commuteMinutes),
    officeDays: num(d.officeDays),
    rent: parseAmount(d.rent),
  };
}

const money = (v: number) =>
  v.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const ROWS: Array<{ metric: Metric; label: string; hint: string; format: (r: OfferResult) => string }> = [
  { metric: "firstYear", label: "First year", hint: "Base, bonus, and signing", format: (r) => money(r.firstYear) },
  { metric: "yearly", label: "Every year after", hint: "Base and bonus", format: (r) => money(r.yearly) },
  { metric: "afterRent", label: "Left each month after rent", hint: "Before taxes", format: (r) => money(r.afterRent) },
  { metric: "commuteHours", label: "Commuting", hint: "Round trip, per year", format: (r) => `${r.commuteHours.toLocaleString()} hrs` },
  {
    metric: "realHourly",
    label: "Real hourly pay",
    hint: "Counting commute time as work time",
    format: (r) => r.realHourly.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 }),
  },
];

const FIELDS: Array<{ key: keyof Draft; label: string; placeholder: string; inputMode: "decimal" | "numeric" | "text"; help?: string }> = [
  { key: "base", label: "Base salary (yearly)", placeholder: "$72,000 or 72k", inputMode: "decimal" },
  { key: "bonus", label: "Yearly bonus", placeholder: "$0", inputMode: "decimal", help: "Target bonus, if they told you one" },
  { key: "signing", label: "Signing bonus", placeholder: "$0", inputMode: "decimal" },
  { key: "ptoDays", label: "Paid days off", placeholder: "15", inputMode: "numeric", help: "Not counting holidays" },
  { key: "commuteMinutes", label: "Commute, one way (minutes)", placeholder: "25", inputMode: "numeric" },
  { key: "officeDays", label: "Office days per week", placeholder: "5", inputMode: "numeric", help: "0 if fully remote" },
  { key: "rent", label: "Monthly rent there", placeholder: "$1,500", inputMode: "decimal" },
];

export default function OfferCompare() {
  const [drafts, setDrafts] = useState<Draft[]>(() => [newDraft(0), newDraft(1)]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      if (Array.isArray(saved) && saved.length >= 1) setDrafts(saved.slice(0, MAX_OFFERS));
    } catch {
      // Bad or blocked storage: keep the blank offers.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
    } catch {
      // Ignore.
    }
  }, [drafts, loaded]);

  const offers = useMemo(() => drafts.map(toOffer), [drafts]);
  const results = useMemo(() => offers.map(evaluateOffer), [offers]);
  const best = useMemo(() => bestByMetric(results), [results]);
  const ready = results.filter((r) => r.yearly > 0).length >= 2;

  const update = (id: string, key: keyof Draft, value: string) =>
    setDrafts((ds) => ds.map((d) => (d.id === id ? { ...d, [key]: value } : d)));

  return (
    <div className="space-y-8">
      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
        {drafts.map((d, i) => (
          <fieldset key={d.id} className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <legend className="sr-only">{offers[i].label}</legend>
              <Input
                aria-label="Company or offer name"
                value={d.label}
                onChange={(e) => update(d.id, "label", e.target.value)}
                placeholder={`Offer ${String.fromCharCode(65 + i)} (company)`}
                className="h-9 border-transparent bg-transparent px-1 font-display text-lg font-semibold shadow-none focus-visible:border-input"
              />
              {drafts.length > 2 ? (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${offers[i].label}`}
                  onClick={() => setDrafts((ds) => ds.filter((x) => x.id !== d.id))}
                >
                  <Trash className="size-4" aria-hidden />
                </Button>
              ) : null}
            </div>
            {FIELDS.map((f) => {
              const id = `${d.id}-${f.key}`;
              return (
                <div key={f.key} className="space-y-1">
                  <label htmlFor={id} className="text-sm text-foreground/80">
                    {f.label}
                  </label>
                  <Input
                    id={id}
                    inputMode={f.inputMode}
                    value={d[f.key]}
                    onChange={(e) => update(d.id, f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="tabular-nums"
                    aria-describedby={f.help ? `${id}-help` : undefined}
                  />
                  {f.help ? (
                    <p id={`${id}-help`} className="text-xs text-muted-foreground">
                      {f.help}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </fieldset>
        ))}
        {drafts.length < MAX_OFFERS ? (
          <button
            type="button"
            onClick={() => setDrafts((ds) => [...ds, newDraft(ds.length, `offer-${Date.now()}`)])}
            className="flex min-h-40 flex-col items-center justify-center gap-2 self-start rounded-2xl border border-dashed border-border text-sm text-muted-foreground transition-colors duration-200 hover:border-primary/40 hover:bg-primary/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Plus className="size-5" weight="bold" aria-hidden />
            Add a third offer
          </button>
        ) : null}
      </div>

      <section aria-labelledby="compare-heading" aria-live="polite" className="space-y-3">
        <h2 id="compare-heading" className="text-lg font-semibold text-foreground">
          Side by side
        </h2>
        {ready ? (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="px-4 py-3 font-medium text-muted-foreground">
                    <span className="sr-only">Measure</span>
                  </th>
                  {offers.map((o) => (
                    <th key={o.id} scope="col" className="px-4 py-3 font-semibold text-foreground">
                      {o.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.metric} className="border-b border-border last:border-0">
                    <th scope="row" className="px-4 py-3 text-left font-normal">
                      <span className="block text-foreground">{row.label}</span>
                      <span className="block text-xs text-muted-foreground">{row.hint}</span>
                    </th>
                    {results.map((r) => (
                      <td key={r.id} className="px-4 py-3 tabular-nums">
                        {r.yearly > 0 ? (
                          <span className={cn(best[row.metric] === r.id ? "hl hl-static font-semibold" : "text-foreground")}>
                            {row.format(r)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Add a salary</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border bg-card/60 p-5 text-sm text-foreground/75">
            Add a base salary to at least two offers and the comparison shows up here, with the better
            number in each row highlighted.
          </p>
        )}
        <p className="flex gap-2 text-xs text-muted-foreground">
          <Info className="mt-px size-4 shrink-0" aria-hidden />
          Everything is before taxes, because taxes depend on where you live and how you file. Your
          numbers stay in this browser. Salary data for your field is on Levels.fyi and the BLS
          Occupational Outlook Handbook, both in the Student Hub.
        </p>
      </section>
    </div>
  );
}
