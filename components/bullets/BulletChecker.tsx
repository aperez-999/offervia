"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { ArrowCounterClockwise, CheckCircle, Lightbulb, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { checkBullets, type BulletReport, type BulletVerdict } from "@/lib/bullets/check";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "offervia:bullets:draft_v1";

const EXAMPLE = [
  "Responsible for managing social media accounts for the club",
  "Built a Python script that cut weekly inventory counts from 3 hours to 20 minutes",
  "I helped with various events and successfully worked with the team",
  "Tutored 14 first-year students in calculus, and 11 of them raised their grade by at least one letter",
].join("\n");

const VERDICT: Record<BulletVerdict, { label: string; className: string }> = {
  strong: { label: "Strong", className: "hl hl-static font-semibold" },
  okay: { label: "Almost", className: "border border-border bg-muted text-foreground/80" },
  "needs-work": { label: "Needs work", className: "border border-warning/40 bg-warning/10 text-foreground" },
};

/** Split a bullet into plain and flagged segments from its issue spans. */
function segments(report: BulletReport) {
  const spans = report.issues
    .flatMap((i) => i.spans)
    .sort((a, b) => a[0] - b[0])
    .reduce<Array<[number, number]>>((acc, [s, e]) => {
      const last = acc[acc.length - 1];
      if (last && s <= last[1]) last[1] = Math.max(last[1], e);
      else acc.push([s, e]);
      return acc;
    }, []);
  const out: Array<{ text: string; flagged: boolean }> = [];
  let i = 0;
  for (const [s, e] of spans) {
    if (s > i) out.push({ text: report.text.slice(i, s), flagged: false });
    out.push({ text: report.text.slice(s, e), flagged: true });
    i = e;
  }
  if (i < report.text.length) out.push({ text: report.text.slice(i), flagged: false });
  return out;
}

export default function BulletChecker() {
  const [text, setText] = useState("");
  const [loaded, setLoaded] = useState(false);
  const deferred = useDeferredValue(text);
  const summary = useMemo(() => checkBullets(deferred), [deferred]);

  useEffect(() => {
    try {
      setText(localStorage.getItem(STORAGE_KEY) ?? "");
    } catch {
      // Private mode or blocked storage: start empty.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, text);
    } catch {
      // Not worth interrupting anyone over.
    }
  }, [text, loaded]);

  const total = summary.bullets.length;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-start">
      <section className="space-y-3 lg:sticky lg:top-24" aria-labelledby="bullets-input">
        <div className="flex items-end justify-between gap-3">
          <label id="bullets-input" htmlFor="bullets" className="text-sm font-medium text-foreground">
            Your bullets, one per line
          </label>
          <div className="flex gap-1">
            {text ? (
              <Button variant="ghost" size="sm" onClick={() => setText("")}>
                <ArrowCounterClockwise className="size-4" aria-hidden />
                Clear
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setText(EXAMPLE)}>
                Try an example
              </Button>
            )}
          </div>
        </div>
        <Textarea
          id="bullets"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"• Led a team of 4 to rebuild the club website\n• Cut checkout time by 20% by…"}
          className="min-h-72 resize-y bg-card text-[15px] leading-relaxed"
          spellCheck
        />
        <p className="text-xs text-muted-foreground">
          Checked as you type, right here in your browser. Nothing is sent anywhere, and your draft
          stays on this device.
        </p>
      </section>

      <section aria-live="polite" aria-label="Results" className="space-y-4">
        {total === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/60 p-6">
            <p className="font-medium text-foreground">Paste the bullets from one job or project.</p>
            <ul className="mt-3 space-y-2 text-sm text-foreground/75">
              <li>Each line gets checked for a strong opening verb, a real number, and length.</li>
              <li>Filler words and &ldquo;I&rdquo; or &ldquo;my&rdquo; get underlined so they&apos;re easy to cut.</li>
              <li>
                Bullets that pass everything get a <span className="hl hl-static">highlight</span>.
              </li>
            </ul>
          </div>
        ) : (
          <>
            <p className="text-sm text-foreground/80">
              <span className="font-semibold text-foreground tabular-nums">
                {summary.strong} of {total}
              </span>{" "}
              {total === 1 ? "bullet is" : "bullets are"} strong.
              {summary.needsWork > 0
                ? ` Start with the ${summary.needsWork === 1 ? "one" : summary.needsWork} marked “Needs work.”`
                : summary.strong === total
                  ? " Nice. These are ready to use."
                  : ""}
            </p>
            <ol className="space-y-3">
              {summary.bullets.map((b, idx) => {
                const v = VERDICT[b.verdict];
                return (
                  <li key={`${idx}-${b.text}`} className="rounded-2xl border border-border bg-card p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[15px] leading-relaxed text-foreground">
                        {segments(b).map((seg, i) =>
                          seg.flagged ? (
                            <span
                              key={i}
                              className="underline decoration-warning decoration-wavy decoration-[1.5px] underline-offset-[5px]"
                            >
                              {seg.text}
                            </span>
                          ) : (
                            <span key={i}>{seg.text}</span>
                          )
                        )}
                      </p>
                      <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-xs", v.className)}>{v.label}</span>
                    </div>
                    {b.issues.length > 0 ? (
                      <ul className="mt-3 space-y-2 border-t border-border pt-3">
                        {b.issues.map((issue) => (
                          <li key={issue.kind} className="flex gap-2.5 text-sm">
                            <WarningCircle className="mt-0.5 size-4 shrink-0 text-warning" weight="duotone" aria-hidden />
                            <span>
                              <span className="text-foreground">{issue.message}</span>{" "}
                              <span className="text-muted-foreground">{issue.fix}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                        <CheckCircle className="size-4 text-reward" weight="fill" aria-hidden />
                        Starts with a verb, has a number, and reads cleanly.
                      </p>
                    )}
                  </li>
                );
              })}
            </ol>
            <p className="flex gap-2 rounded-xl bg-muted/60 p-3 text-sm text-foreground/80">
              <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" weight="duotone" aria-hidden />
              A rule checker can&apos;t tell whether a bullet is true or relevant to the job. Run your
              resume through the scanner next to see which keywords a posting expects.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
