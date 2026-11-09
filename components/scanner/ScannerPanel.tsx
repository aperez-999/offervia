"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, CircleNotch, ClipboardText, FileText, Lightbulb, PenNib, Star, Target, X } from "@phosphor-icons/react/dist/ssr";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Reveal } from "@/components/motion/Reveal";
import Dropzone from "@/components/resume/Dropzone";
import { useToast } from "@/hooks/use-toast";
import { postForm, postJson, type SafeFetchResult } from "@/lib/safe-fetch";
import {
  ATS_HISTORY_LS_KEY,
  ATS_RESUME_JD_LS_KEY,
  type AtsHistoryEntry,
  type AtsResult,
} from "@/lib/ats/utils";

const EXAMPLE_JD = `Frontend Engineer

We're hiring a Frontend Engineer to build accessible, performant web apps. You'll implement UI components, collaborate with design, write tests, and improve performance.

Requirements: JavaScript, TypeScript, React, HTML, CSS, REST APIs, unit testing (Jest). Must have 3+ years of experience and a Bachelor's degree.
Nice to have: Next.js, Tailwind CSS, accessibility (a11y), CI/CD, performance profiling.`;

function scoreLabel(score: number): { label: string; tone: string } {
  if (score >= 80) return { label: "Strong match", tone: "text-success" };
  if (score >= 60) return { label: "Good match", tone: "text-primary" };
  if (score >= 40) return { label: "Fair match", tone: "text-warning" };
  return { label: "Needs work", tone: "text-destructive" };
}

function loadHistory(): AtsHistoryEntry[] {
  try {
    const raw = localStorage.getItem(ATS_HISTORY_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as AtsHistoryEntry[]).slice(0, 6) : [];
  } catch {
    return [];
  }
}

export default function ScannerPanel() {
  const router = useRouter();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();

  const [resumeMode, setResumeMode] = useState<"paste" | "upload">("paste");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AtsResult | null>(null);
  const [history, setHistory] = useState<AtsHistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  const resumeReady =
    resumeMode === "upload" ? !!resumeFile : resumeText.trim().length >= 50;
  const canScan = resumeReady && jd.trim().length >= 20 && !loading;

  const ringColor = useMemo(() => {
    const s = result?.match_score ?? 0;
    return s >= 60
      ? "var(--primary-button)"
      : s >= 40
        ? "oklch(0.75 0.15 80)"
        : "var(--destructive)";
  }, [result]);

  function pushHistory(entry: AtsResult) {
    const record: AtsHistoryEntry = {
      id: `${Date.now()}`,
      created_at: Date.now(),
      role_title: entry.role_title,
      match_score: entry.match_score,
      jd_excerpt: jd.trim().slice(0, 120),
    };
    const next = [record, ...history].slice(0, 6);
    setHistory(next);
    try {
      localStorage.setItem(ATS_HISTORY_LS_KEY, JSON.stringify(next));
    } catch {}
  }

  async function handleScan() {
    if (!canScan) return;
    setLoading(true);
    setError(null);
    try {
      let resp: SafeFetchResult<{ content?: AtsResult }>;
      if (resumeMode === "upload" && resumeFile) {
        const form = new FormData();
        form.append("file", resumeFile);
        form.append("jd", jd);
        resp = await postForm<{ content?: AtsResult }>("/api/ats-scan", form, {
          timeoutMs: 45_000,
        });
      } else {
        resp = await postJson<{ content?: AtsResult }>(
          "/api/ats-scan",
          { resumeText: resumeText.trim(), jd: jd.trim() },
          { timeoutMs: 45_000 },
        );
      }

      if (!resp.ok) {
        const msg =
          resp.error ||
          (resp.status === 429
            ? "Too many scans. Try again in a moment."
            : "The scan didn't finish. Try again in a moment.");
        setError(msg);
        toast({ title: "Scan failed", description: msg, variant: "destructive" });
        return;
      }

      const content = resp.data?.content;
      if (!content) {
        const msg = "The scan came back empty. Try again in a moment.";
        setError(msg);
        toast({ title: "Scan failed", description: msg, variant: "destructive" });
        return;
      }

      setResult(content);
      pushHistory(content);
      toast({ variant: "info",
        title: `${content.match_score}% keyword match`,
        description: `${content.matched_count} of ${content.total} keywords found in your resume.`,
      });
    } catch {
      const msg = "Couldn't reach the server. Check your connection and try again.";
      setError(msg);
      toast({ title: "Scan failed", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  function tailorResume() {
    try {
      localStorage.setItem(ATS_RESUME_JD_LS_KEY, jd.trim());
    } catch {}
    const role = result?.role_title && result.role_title !== "This role" ? result.role_title : "";
    const params = new URLSearchParams({ from: "scanner", step: "3" });
    if (role) params.set("role", role);
    router.push(`/resume?${params.toString()}`);
  }

  function copyMissing() {
    if (!result?.missing.length) return;
    navigator.clipboard.writeText(result.missing.join(", ")).then(
      () => toast({ variant: "success", title: "Missing keywords copied" }),
      () => toast({ title: "Copy failed", variant: "destructive" }),
    );
  }

  const label = result ? scoreLabel(result.match_score) : null;

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="flex items-center gap-2 text-2xl font-semibold text-foreground">
          <Target className="size-6 text-primary" /> ATS keyword scanner
        </h1>
        <p className="max-w-2xl text-sm text-foreground/60">
          Paste your resume and a job description. You&apos;ll see which keywords
          from the posting your resume already has and which ones are missing.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        {/* Inputs */}
        <Reveal className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="space-y-4">
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="ats-resume"
                  className="block text-sm font-medium text-foreground"
                >
                  Your resume
                </label>
                <div
                  className="inline-flex rounded-lg border border-border bg-background/50 p-0.5"
                  role="tablist"
                  aria-label="Resume input method"
                >
                  {(["paste", "upload"] as const).map((m) => {
                    const active = resumeMode === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setResumeMode(m)}
                        className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/60 hover:text-foreground"
                        }`}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              </div>

              {resumeMode === "paste" ? (
                <>
                  <Textarea
                    id="ats-resume"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    placeholder="Paste your resume text here…"
                    className="min-h-[140px] max-h-[220px] resize-none overflow-auto"
                  />
                  <p className="mt-1 text-xs text-foreground/50">
                    {resumeText.trim().length < 50
                      ? `Add at least ${50 - resumeText.trim().length} more characters.`
                      : "Enough to scan."}
                  </p>
                </>
              ) : resumeFile ? (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/60 p-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm text-foreground">
                    <FileText className="size-4 shrink-0 text-primary" />
                    <span className="truncate">{resumeFile.name}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setResumeFile(null)}
                    className="shrink-0 rounded-md p-1 text-foreground/50 transition-colors hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    aria-label="Remove file"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ) : (
                <Dropzone onFile={(f) => setResumeFile(f)} maxSizeMb={5} />
              )}
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label
                  htmlFor="ats-jd"
                  className="block text-sm font-medium text-foreground"
                >
                  Job description
                </label>
                <button
                  type="button"
                  onClick={() => setJd(EXAMPLE_JD)}
                  className="text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  Use example
                </button>
              </div>
              <Textarea
                id="ats-jd"
                value={jd}
                onChange={(e) => setJd(e.target.value)}
                placeholder="Paste the job description you're applying to…"
                className="min-h-[160px] max-h-[260px] resize-none overflow-auto"
              />
            </div>

            <Button
              onClick={handleScan}
              disabled={!canScan}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <CircleNotch className="size-4 animate-spin" /> Comparing keywords…
                </>
              ) : (
                <>
                  <Target className="size-4" /> Scan for keywords
                </>
              )}
            </Button>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            {history.length > 0 && (
              <div className="border-t border-border pt-3">
                <p className="mb-2 text-xs font-medium text-foreground/40">
                  Recent scans
                </p>
                <ul className="space-y-1.5">
                  {history.map((h) => (
                    <li
                      key={h.id}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="min-w-0 truncate text-foreground/70">
                        {h.role_title || h.jd_excerpt || "Job scan"}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${scoreLabel(h.match_score).tone} bg-foreground/[0.04]`}
                      >
                        {h.match_score}%
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Reveal>

        {/* Results */}
        <Reveal
          index={1}
          className="rounded-2xl border border-border bg-card p-5 shadow-sm lg:sticky lg:top-20"
        >
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={reduceMotion ? undefined : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                className="space-y-4"
                aria-hidden
              >
                <div className="mx-auto size-28 animate-pulse rounded-full bg-foreground/10" />
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-4 animate-pulse rounded bg-foreground/10"
                      style={{ width: `${88 - (i % 3) * 14}%` }}
                    />
                  ))}
                </div>
              </motion.div>
            ) : result ? (
              <motion.div
                key="result"
                initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {/* Score */}
                <div className="flex items-center gap-4">
                  <div className="relative grid size-24 shrink-0 place-items-center">
                    <svg viewBox="0 0 100 100" className="size-24 -rotate-90">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke="color-mix(in oklch, var(--foreground) 10%, transparent)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="none"
                        stroke={ringColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 42}
                        strokeDashoffset={2 * Math.PI * 42 * (1 - result.match_score / 100)}
                      />
                    </svg>
                    <span className="absolute text-2xl font-bold text-foreground">
                      {result.match_score}%
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className={`text-lg font-semibold ${label?.tone}`}>
                      {label?.label}
                    </p>
                    <p className="text-sm text-foreground/60">
                      {result.matched_count} of {result.total} keywords matched
                    </p>
                    {result.must_total > 0 && (
                      <p className="mt-0.5 text-xs text-foreground/50">
                        Required keywords: {result.must_matched}/{result.must_total} covered
                      </p>
                    )}
                  </div>
                </div>

                {/* Matched */}
                {result.matched.length > 0 && (
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Check className="size-4 text-success" /> Matched keywords
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.matched.map((k) => (
                        <span
                          key={k}
                          className="rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success"
                        >
                          {k}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Missing */}
                {result.missing.length > 0 && (
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <X className="size-4 text-destructive" /> Missing keywords
                      </p>
                      <button
                        type="button"
                        onClick={copyMissing}
                        className="flex items-center gap-1 text-xs font-medium text-foreground/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                      >
                        <ClipboardText className="size-3.5" /> Copy
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {result.keywords
                        .filter((k) => !k.matched)
                        .map((k) => (
                          <span
                            key={k.term}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${
                              k.importance === "must"
                                ? "border-destructive/30 bg-destructive/10 text-destructive"
                                : "border-warning/30 bg-warning/10 text-warning"
                            }`}
                            title={k.importance === "must" ? "Required by this job" : "Preferred"}
                          >
                            {k.importance === "must" && <Star className="size-3 fill-current" />}
                            {k.term}
                          </span>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-foreground/45">
                      <Star className="mr-1 inline size-3 fill-current text-destructive" />
                      = required by the job. Only add keywords you can honestly back up.
                    </p>
                  </div>
                )}

                {/* Tips */}
                {result.tips.length > 0 && (
                  <div className="rounded-xl border border-border bg-background/50 p-3.5">
                    <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Lightbulb className="size-4 text-primary" /> How to improve
                    </p>
                    <ul className="space-y-1.5">
                      {result.tips.map((tip, i) => (
                        <li
                          key={i}
                          className="flex gap-2 text-sm text-foreground/70"
                        >
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/60" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button onClick={tailorResume} className="flex-1">
                    <PenNib className="size-4" /> Tailor my resume
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setResult(null);
                      setError(null);
                    }}
                  >
                    New scan
                  </Button>
                </div>
              </motion.div>
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center gap-2 text-center text-sm text-foreground/50">
                <Target className="size-9 text-foreground/25" />
                <p>Your results will show up here.</p>
                <p className="max-w-xs text-xs text-foreground/40">
                  Add your resume and a job description, then scan.
                </p>
              </div>
            )}
          </AnimatePresence>
        </Reveal>
      </div>
    </div>
  );
}
