"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Copy, Download, FileText, Loader2, Sparkles, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Dropzone from "@/components/resume/Dropzone";
import { useToast } from "@/hooks/use-toast";
import { postJson, postForm, type SafeFetchResult } from "@/lib/safe-fetch";
import { printAsPdf } from "@/lib/print-pdf";
import { Reveal } from "@/components/motion/Reveal";
import {
  COVER_LETTER_TONES,
  type CoverLetterTone,
} from "@/lib/prompts/cover-letter-system";
import type { PlanType } from "@/lib/plans";

export default function CoverLetterStudio({
  defaultRole = "",
  defaultCompany = "",
}: {
  plan?: PlanType;
  defaultRole?: string;
  defaultCompany?: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const reduceMotion = useReducedMotion();

  const [resumeText, setResumeText] = useState("");
  const [resumeMode, setResumeMode] = useState<"paste" | "upload">("paste");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [companyName, setCompanyName] = useState(defaultCompany);
  const [roleTitle, setRoleTitle] = useState(defaultRole);
  const [tone, setTone] = useState<CoverLetterTone>("professional");

  const [generating, setGenerating] = useState(false);
  const [letter, setLetter] = useState("");
  const [error, setError] = useState<string | null>(null);

  const hasResume =
    resumeMode === "upload" ? !!resumeFile : resumeText.trim().length >= 100;
  const canGenerate =
    hasResume && jobDescription.trim().length >= 20 && !generating;

  function handleLimitReached() {
    const msg =
      "You've reached your monthly cover letter limit. Upgrade to Pro to continue.";
    setError(msg);
    toast({
      title: "Limit reached",
      description: msg,
      variant: "upgrade",
      duration: 8000,
      action: (
        <Button
          size="default"
          className="cursor-pointer bg-primary-button text-primary-button-foreground hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          onClick={() => router.push("/upgrade")}
        >
          Upgrade to Pro
        </Button>
      ),
    });
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    setGenerating(true);
    setError(null);
    try {
      let resp: SafeFetchResult<{ content?: string; tone?: string }>;

      if (resumeMode === "upload" && resumeFile) {
        const form = new FormData();
        form.append("file", resumeFile);
        form.append("jobDescription", jobDescription);
        form.append("companyName", companyName);
        form.append("roleTitle", roleTitle);
        form.append("tone", tone);
        resp = await postForm<{ content?: string }>("/api/cover-letter", form, {
          timeoutMs: 45_000,
        });
      } else {
        resp = await postJson<{ content?: string; tone?: string }>(
          "/api/cover-letter",
          { resumeText, jobDescription, companyName, roleTitle, tone },
          { timeoutMs: 45_000 },
        );
      }

      if (!resp.ok) {
        if (resp.status === 403) {
          handleLimitReached();
          return;
        }
        const msg =
          resp.error ||
          (resp.status === 429
            ? "Too many requests. Try again in a moment."
            : "AI might be busy, or your input is too large. Please try again.");
        setError(msg);
        toast({ title: "Failed to generate", description: msg, variant: "destructive" });
        return;
      }

      setLetter(String(resp.data?.content || ""));
      toast({ title: "Cover letter ready" });
    } catch {
      const msg = "Something went wrong. Please try again.";
      setError(msg);
      toast({ title: "Failed to generate", description: msg, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(letter).then(
      () => toast({ title: "Copied to clipboard" }),
      () => toast({ title: "Copy failed", variant: "destructive" }),
    );
  }

  function download() {
    const blob = new Blob([letter], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug =
      [companyName, roleTitle]
        .map((s) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
        .filter(Boolean)
        .join("-") || "offervia";
    a.download = `cover-letter-${slug}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Inputs */}
      <Reveal className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="cl-company"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Company <span className="text-foreground/40">(optional)</span>
              </label>
              <Input
                id="cl-company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Inc."
              />
            </div>
            <div>
              <label
                htmlFor="cl-role"
                className="mb-1.5 block text-sm font-medium text-foreground"
              >
                Role <span className="text-foreground/40">(optional)</span>
              </label>
              <Input
                id="cl-role"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="Senior Product Designer"
              />
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label
                htmlFor="cl-resume"
                className="block text-sm font-medium text-foreground"
              >
                Your resume / experience
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
                      {m === "paste" ? "Paste" : "Upload"}
                    </button>
                  );
                })}
              </div>
            </div>

            {resumeMode === "paste" ? (
              <>
                <Textarea
                  id="cl-resume"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text or a summary of your experience…"
                  className="min-h-[160px] resize-y"
                />
                <p className="mt-1 text-xs text-foreground/50">
                  {resumeText.trim().length < 100
                    ? `Add at least ${100 - resumeText.trim().length} more characters.`
                    : "Looks good."}
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
              <Dropzone onFile={(f) => setResumeFile(f)} fileName={undefined} maxSizeMb={5} />
            )}
          </div>

          <div>
            <label
              htmlFor="cl-jd"
              className="mb-1.5 block text-sm font-medium text-foreground"
            >
              Job description
            </label>
            <Textarea
              id="cl-jd"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description you're applying to…"
              className="min-h-[140px] resize-y"
            />
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-foreground">Tone</span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Tone">
              {COVER_LETTER_TONES.map((t) => {
                const active = tone === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setTone(t.value)}
                    className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                      active
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-background/50 text-foreground/70 hover:bg-foreground/[0.04]"
                    }`}
                    title={t.hint}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Writing…
              </>
            ) : (
              <>
                <Sparkles className="size-4" /> Generate cover letter
              </>
            )}
          </Button>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </Reveal>

      {/* Output */}
      <Reveal
        index={1}
        className="rounded-2xl border border-border bg-card/70 p-6 shadow-sm"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <FileText className="size-4 text-primary" /> Your cover letter
          </div>
          {letter ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copy}>
                <Copy className="size-3.5" /> Copy
              </Button>
              <Button variant="outline" size="sm" onClick={download}>
                <Download className="size-3.5" /> .txt
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  printAsPdf(
                    [companyName, roleTitle].filter(Boolean).join(" · ") ||
                      "Cover letter",
                    letter,
                  )
                }
              >
                <Printer className="size-3.5" /> PDF
              </Button>
            </div>
          ) : null}
        </div>

        <div className="mt-4 min-h-[360px]">
          <AnimatePresence mode="wait">
            {generating ? (
              <motion.div
                key="loading"
                initial={reduceMotion ? undefined : { opacity: 0 }}
                animate={reduceMotion ? undefined : { opacity: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0 }}
                className="space-y-3"
                aria-hidden
              >
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-4 animate-pulse rounded bg-foreground/10"
                    style={{ width: `${90 - (i % 3) * 12}%` }}
                  />
                ))}
              </motion.div>
            ) : letter ? (
              <motion.pre
                key="letter"
                initial={reduceMotion ? undefined : { opacity: 0, y: 8 }}
                animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-foreground/90"
              >
                {letter}
              </motion.pre>
            ) : (
              <div className="flex h-[360px] flex-col items-center justify-center gap-2 text-center text-sm text-foreground/50">
                <FileText className="size-8 text-foreground/25" />
                <p>Your tailored cover letter will appear here.</p>
                <p className="text-xs text-foreground/40">
                  Fill in your resume and the job description, pick a tone, then generate.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </Reveal>
    </div>
  );
}
