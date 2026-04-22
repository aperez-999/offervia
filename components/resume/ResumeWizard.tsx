// components/resume/ResumeWizard.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Upload,
  ClipboardCopy,
  Download,
  Trash2,
  Sparkles,
  Building2,
  Briefcase,
  MapPin,
  Link as LinkIcon,
  ExternalLink,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { postForm } from "@/lib/safe-fetch"; // uses your safeFetch helper
import { AnimatePresence, motion } from "framer-motion";

/* ---------------------------------- Data --------------------------------- */

const steps = [
  { id: 1, title: "Upload Resume" },
  { id: 2, title: "Company Targeting" },
  { id: 3, title: "Job Description" },
  { id: 4, title: "Tailor & Review" },
];

const ACCEPTED_TYPES = [".pdf", ".doc", ".docx"];
const MAX_SIZE_MB = 8;

const JD_LS_KEY = "offervia:resume:jd_v1";
const DESIRED_STEP_LS_KEY = "offervia:resume:desiredStep_v1";


const TECH_DICT = [
  "react","next.js","typescript","javascript","node","node.js","graphql","rest","api","html","css","tailwind","redux","jest","rtl","cypress","testing","vitest","playwright","aws","gcp","azure","docker","kubernetes","sql","postgres","mysql","mongodb","python","go","java","c++","a11y","accessibility","performance",
];

/* --------------------------------- Utils --------------------------------- */

function detectTechs(text: string): string[] {
  const hay = text.toLowerCase();
  const set = new Set<string>();
  for (const t of TECH_DICT) {
    const rx =
      t === "c++"
        ? /\bc\+\+\b/i
        : new RegExp(`(^|[^a-z0-9])${t.replace(".", "\\.")}([^a-z0-9]|$)`, "i");
    if (rx.test(hay)) set.add(t);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

function approxTokens(s: string) {
  return Math.max(1, Math.round((s || "").length / 4)); // ~4 chars/token
}

function bytesToStr(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeText(s: string) {
  return s
    .replace(/\r\n/g, "\n")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\t/g, "  ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

/* ------------------------------- Component ------------------------------- */

export default function ResumeWizard() {
  const router = useRouter();
  const search = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState(1);

  // Step 1: resume
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeSize, setResumeSize] = useState<number>(0);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [resumeText, setResumeText] = useState<string>("");

  // Step 2: company targeting
  const [companyName, setCompanyName] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [location, setLocation] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");

  // Step 3: JD
  const [jd, setJd] = useState<string>("");
  const techs = useMemo(() => detectTechs(jd), [jd]);

  // Step 4: AI output
  const [aiText, setAiText] = useState<string>("");
  const [generating, setGenerating] = useState(false);
  const [templateMode, setTemplateMode] = useState(true);
  const [showExpanded, setShowExpanded] = useState(false);

  // PDF zoom
  const [zoom, setZoom] = useState<"fit" | "110" | "125" | "150">("fit");

  // Err/UI
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  // restore JD draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(JD_LS_KEY);
      if (raw) setJd(raw);
    } catch {}
  }, []);

  // Allow deep-linking into a step (used by Job Packet handoff from Scanner)
  useEffect(() => {
    const stepRaw = search.get("step");
    if (!stepRaw) return;
    const parsed = Number(stepRaw);
    if (!Number.isFinite(parsed)) return;
    const next = Math.max(1, Math.min(steps.length, Math.floor(parsed)));
    setStep(next);
    const from = search.get("from") || "";
    if (from === "scanner" || from.startsWith("scanner")) {
      toast({
        title: "Job description ready",
        description: "Your job description was carried over from the Scanner.",
      });
    }
    // intentionally run only when URL params change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);
  useEffect(() => {
    try {
      localStorage.setItem(JD_LS_KEY, jd);
    } catch {}
  }, [jd]);

  // preview URL for the uploaded file
  useEffect(() => {
    if (!resumeFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(resumeFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeFile?.name]);

  const progress = useMemo(() => (step / steps.length) * 100, [step]);
  const step1Valid = !!resumeFileName;
  const step3Valid = jd.trim().length >= 20;

  /* ------------------------------ Navigation ----------------------------- */

  function onNext() {
    setAttempted(true);
    setError(null);
    if (step === 1 && !step1Valid) {
      setError("Please upload a resume before continuing.");
      return;
    }
    if (step === 3 && !step3Valid) {
      setError("Job description must be at least 20 characters.");
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length));
  }

  function onBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  /* -------------------------------- Upload -------------------------------- */

  function onFileSelected(file: File) {
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!ACCEPTED_TYPES.includes(ext)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, DOC, or DOCX.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Max size is ${MAX_SIZE_MB}MB.`,
        variant: "destructive",
      });
      return;
    }

    setResumeFileName(file.name);
    setResumeFile(file);
    setResumeSize(file.size);
    setAiText(""); // clear AI output if new file

    // If the user came from the Scanner Job Packet handoff, auto-advance once a resume exists.
    try {
      const desired = localStorage.getItem(DESIRED_STEP_LS_KEY);
      if (desired) {
        const parsed = Number(desired);
        if (Number.isFinite(parsed)) {
          const nextStep = Math.max(1, Math.min(steps.length, Math.floor(parsed)));
          setStep(nextStep);
        }
        localStorage.removeItem(DESIRED_STEP_LS_KEY);
      }
    } catch {
      // noop
    }

    // Try to store text for simple text files; PDFs/DOCX will be handled server-side
    try {
      if (file.type.startsWith("text")) {
        file.text().then((txt) => setResumeText(normalizeText(txt))).catch(() => setResumeText(""));
      } else {
        setResumeText("");
      }
    } catch {
      setResumeText("");
    }
  }

  function removeFile() {
    setResumeFile(null);
    setResumeFileName("");
    setResumeSize(0);
    setAiText("");
  }

  /* ------------------------------- Generate ------------------------------- */

  const handleGenerate = async () => {
    if (!resumeFile || jd.trim().length < 20) return;
    setGenerating(true);
    setError(null);
    try {
      // Debug: confirm file and template flag
      try {
        // Attempt to preview text if it's a plain text file; otherwise log filename only
        if (resumeFile.type.startsWith("text")) {
          await resumeFile.text();
        }
      } catch {}

      const fd = new FormData();
      fd.append("file", resumeFile);
      fd.append("jobDescription", jd);
      // pass targeting + template flag to API
      fd.append("companyName", companyName);
      fd.append("roleTitle", roleTitle);
      fd.append("location", location);
      fd.append("companyUrl", companyUrl);
      fd.append("template", templateMode ? "1" : "0");
      if (resumeText) {
        // Also send parsed text when available so the API can prefer it
        fd.append("resumeText", resumeText);
      }

      const resp = await postForm<{ content?: string; error?: string }>(
        "/api/resume-tailor",
        fd,
        { timeoutMs: 45_000 }
      );

      // --- Rate-limit, plan limit & other friendly errors ---
      if (!resp.ok) {
        if (resp.status === 429) {
          const msg = resp.error || "You've hit today's free limit for tailoring.";
          setError(msg);
          toast({
            title: "Rate limit reached",
            description: msg,
            variant: "destructive",
          });
          return;
        }
        if (resp.status === 403 && resp.error === "PLAN_LIMIT_REACHED") {
          const msg =
            "You've reached your monthly resume tailoring limit. Upgrade to Pro to continue.";
          setError(msg);
          toast({
            title: "Limit reached",
            description: msg,
            variant: "upgrade",
            duration: 8000,
            action: (
              <Button
                size="default"
                className="cursor-pointer bg-emerald-600 text-white hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                onClick={() => router.push("/upgrade")}
              >
                Upgrade to Pro
              </Button>
            ),
          });
          return;
        }
        if (resp.status === 413) {
          const msg = "Your file is too large. Try a shorter resume or DOCX/text.";
          setError(msg);
          toast({ title: "File too large", description: msg, variant: "destructive" });
          return;
        }
        const generic =
          resp.error ||
          "AI might be busy, or your input is too large. Please try again.";
        setError(generic);
        toast({ title: "Failed to generate", description: generic, variant: "destructive" });
        return;
      }

      setAiText(String(resp.data?.content || ""));
      toast({ title: "Tailored draft generated" });
    } catch (e: unknown) {
      const msg = e instanceof Error && e.name === "AbortError"
        ? "The request timed out. Please try again."
        : "AI might be busy, or your input is too large. Please try again.";
      setError(msg);
      toast({ title: "Failed to generate", description: msg, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  function addToTracker() {
    const company = (companyName || "").trim();
    const position = (roleTitle || "").trim();
    if (!company || !position) {
      toast({
        title: "Missing details",
        description: "Add a company name and role title before sending to the tracker.",
        variant: "destructive",
      });
      return;
    }
    const params = new URLSearchParams();
    params.set("company", company);
    params.set("position", position);
    params.set("status", "Applied");
    params.set("applied_on", new Date().toISOString().slice(0, 10));
    router.push(`/tracker?${params.toString()}`);
  }

  /* ------------------------------- Helpers -------------------------------- */

  function copy(text: string, label = "Copied") {
    navigator.clipboard.writeText(text).then(
      () => toast({ title: label }),
      () => toast({ title: "Copy failed", variant: "destructive" })
    );
  }

  function download(text: string, filename: string) {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // targetingSummary removed - not used in current implementation

  const isPdf =
    !!resumeFileName &&
    (resumeFileName.toLowerCase().endsWith(".pdf") ||
      (resumeFile && resumeFile.type === "application/pdf"));

  const zoomValue = zoom === "fit" ? 1 : Number(zoom) / 100;

  /* -------------------------------- Render -------------------------------- */

  return (
    <>
    <div className="space-y-4 sm:space-y-6 w-full max-w-[2000px] mx-auto px-2 md:px-4">
      {/* Header */}
      <section>
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Resume Tailor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow the steps to tailor your resume to a job posting.
        </p>
      </section>

      <Progress value={progress} className="h-2" />

      {/* Responsive two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[18rem_minmax(0,1fr)] gap-4 lg:gap-8">
        <WizardSidebar steps={steps} current={step} />

        <div className="space-y-4 sm:space-y-6 min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            {/* Step 1 */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <StepContainer title="Upload Resume" description="Upload a PDF or DOCX file.">
              <div className="space-y-3">
                {(() => {
                  const from = search.get("from") || "";
                  const fromScanner = from === "scanner" || from.startsWith("scanner");
                  return fromScanner && jd.trim().length >= 20 && !resumeFileName;
                })() && (
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-900 dark:text-emerald-100 dark:border-emerald-500/20">
                    <div className="font-medium">Job description loaded</div>
                    <div className="mt-0.5 text-xs text-emerald-900/80 dark:text-emerald-100/80">
                      Upload your resume to continue the Job Packet workflow.
                    </div>
                  </div>
                )}
                <Dropzone onFile={onFileSelected} fileName={resumeFileName} />
                {resumeFileName && (
                  <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-background/60 p-3">
                    <div className="text-sm text-foreground">
                      <div className="font-medium">{resumeFileName}</div>
                      <div className="text-xs text-foreground/60">{bytesToStr(resumeSize)}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      {previewUrl && (
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs underline text-foreground/70 hover:text-foreground"
                          title="Open in new tab"
                        >
                          Open <ExternalLink className="inline h-3 w-3" />
                        </a>
                      )}
                      <Button
                        variant="outline"
                        onClick={removeFile}
                        className="border-border text-foreground hover:bg-foreground/[0.06]"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              </StepContainer>
              </motion.div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
              <StepContainer
              title="Company Targeting"
              description="Optional, but highly recommended. This helps the AI tailor language to a specific company, team, and location."
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Building2 className="h-4 w-4" />
                    Company name
                  </label>
                  <Input
                    placeholder="e.g., Stripe"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                  />
                  <p className="text-xs text-foreground/60">
                    If left empty, AI will tailor based on the job description only.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Briefcase className="h-4 w-4" />
                    Role title (optional)
                  </label>
                  <Input
                    placeholder="e.g., Frontend Engineer"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                  />
                </div>

                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <MapPin className="h-4 w-4" />
                    Location (optional)
                  </label>
                  <Input
                    placeholder="e.g., New York, NY (Hybrid)"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <LinkIcon className="h-4 w-4" />
                    Company / team page (optional)
                  </label>
                  <Input
                    placeholder="https://example.com/careers/team"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    className="border-border bg-background/80 text-foreground placeholder:text-foreground/40"
                  />
                </div>
              </div>
              </StepContainer>
              </motion.div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
              <StepContainer
              title="Paste Job Description"
              description="Paste the full job posting text below."
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/60">
                  <span>
                    Characters: <span className="text-foreground/80">{jd.length}</span>
                  </span>
                  <span>
                    ~Tokens: <span className="text-foreground/80">{approxTokens(jd)}</span>
                  </span>
                </div>

                <Textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="min-h-[220px] bg-background/80 text-foreground placeholder:text-foreground/40 border-border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                />

                {techs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-foreground/60">Detected:</span>
                    {techs.map((t) => (
                      <Badge
                        key={t}
                        variant="outline"
                        className="border-border text-foreground/80"
                      >
                        {t}
                      </Badge>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      className="ml-1 h-7 border-border text-foreground hover:bg-foreground/[0.06]"
                      onClick={() => copy(techs.join(", "), "Copied keywords")}
                    >
                      <ClipboardCopy className="mr-1 h-3.5 w-3.5" /> Copy keywords
                    </Button>
                  </div>
                )}

                {error && step === 3 && (
                  <Alert variant="destructive">
                    <AlertTitle>Missing or too short job description</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
              </StepContainer>
              </motion.div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
              <StepContainer
              title="Tailor & Review"
              description="Preview your resume on the left and generate an AI-tailored version on the right."
            >
              {/* Horizontal layout: switches at lg (≥1024px) */}
              <div className="grid lg:grid-rows-2 gap-8">
                {/* Top: File preview */}
                <div className="lg:row-span-1">
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-sm font-medium text-foreground">Resume Preview</div>
                    <div className="flex items-center gap-2">
                      {isPdf && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
                            onClick={() =>
                              setZoom((z) =>
                                z === "fit" ? "110" : z === "110" ? "125" : z === "125" ? "150" : "fit"
                              )
                            }
                            title="Cycle zoom"
                          >
                            {zoom === "fit" ? (
                              <>
                                <ZoomIn className="mr-2 h-4 w-4" /> 110%
                              </>
                            ) : zoom === "110" ? (
                              <>
                                <ZoomIn className="mr-2 h-4 w-4" /> 125%
                              </>
                            ) : zoom === "125" ? (
                              <>
                                <ZoomIn className="mr-2 h-4 w-4" /> 150%
                              </>
                            ) : (
                              <>
                                <ZoomOut className="mr-2 h-4 w-4" /> Fit
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
                            onClick={() => setZoom("fit")}
                            title="Fit to width"
                          >
                            <Maximize2 className="mr-2 h-4 w-4" />
                            Fit
                          </Button>
                        </>
                      )}
                      {previewUrl && (
                        <a
                          href={previewUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs underline text-foreground/70 hover:text-foreground"
                        >
                          Open in new tab <ExternalLink className="ml-1 inline h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="h-[40vh] overflow-hidden rounded-xl border border-border bg-background/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
                    {resumeFile ? (
                      isPdf && previewUrl ? (
                        <div className="h-full w-full overflow-auto">
                          <iframe
                            src={previewUrl + (zoom === "fit" ? "#toolbar=0&view=FitH" : "#toolbar=0")}
                            title="PDF preview"
                            style={{
                              transform: zoom === "fit" ? "none" : `scale(${zoomValue})`,
                              transformOrigin: "top left",
                              width: zoom === "fit" ? "100%" : `${100 / zoomValue}%`,
                              height: zoom === "fit" ? "100%" : `${100 / zoomValue}%`,
                              border: "0",
                            }}
                            className="block"
                          />
                        </div>
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                          <FileText className="mb-3 h-6 w-6 text-foreground/50" />
                          <p className="text-sm text-foreground/80">{resumeFileName}</p>
                          <p className="text-xs text-foreground/60">{bytesToStr(resumeSize)}</p>
                          <p className="mt-3 text-xs text-foreground/60">
                            Live preview isn’t supported for DOC/DOCX. Use “Open in new tab” to view or download.
                          </p>
                        </div>
                      )
                    ) : (
                      <div className="grid h-full place-items-center p-6 text-center">
                        <p className="text-sm text-foreground/60">No file uploaded.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom: AI tailored */}
                <div className="lg:row-span-1 space-y-3 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-foreground">AI Tailored Resume</h2>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={templateMode}
                          onChange={(e) => setTemplateMode(e.target.checked)}
                          className="h-4 w-4 accent-indigo-600"
                          title="When on, the AI returns a clean, sectioned resume template."
                        />
                        <span className="text-foreground/70">Template output</span>
                      </label>
                    </div>
                    <div className="flex items-center flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!aiText}
                        className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
                        onClick={() => aiText && download(aiText, "tailored-resume.txt")}
                      >
                        <Download className="mr-1 h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!aiText}
                        className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
                        onClick={() => aiText && copy(aiText, "Copied tailored draft")}
                      >
                        <ClipboardCopy className="mr-1 h-4 w-4" />
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!aiText}
                        className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
                        onClick={() => setShowExpanded(true)}
                        title="Expand output"
                      >
                        <Maximize2 className="mr-1 h-4 w-4" />
                        Expand
                      </Button>
                    </div>
                  </div>

                  {aiText ? (
                    <Textarea
                      spellCheck
                      className="h-[40vh] resize-none rounded-xl border border-border bg-background/80 p-3 text-sm text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                    />
                  ) : (
                    <div className="h-[40vh] rounded-xl border border-border bg-card/60 p-3 text-sm text-foreground shadow-sm ring-1 ring-white/5 dark:ring-black/10">
                      <p className="text-foreground/60">No AI resume yet. Click Generate to create one.</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-foreground/60">
                    <span>{aiText.length.toLocaleString()} characters</span>
                    <span>~{approxTokens(aiText).toLocaleString()} tokens</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      disabled={generating || !resumeFile || jd.trim().length < 20}
                      onClick={handleGenerate}
                      className="bg-indigo-600 cursor-pointer text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                    >
                      {generating ? (
                        <>
                          <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                          Generating…
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate with AI
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      disabled={!aiText}
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                      onClick={() => {
                        toast({
                          title: "Accepted",
                          description: "You can copy or download the tailored version anytime.",
                        });
                      }}
                    >
                      Accept & Replace
                    </Button>

                    <Button
                      variant="outline"
                      disabled={!aiText}
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                      onClick={addToTracker}
                      title="Create a tracker entry prefilled from this job"
                    >
                      Add to Tracker
                    </Button>
                  </div>
                </div>
              </div>
              </StepContainer>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Step 1 error banner */}
          {error && step === 1 && attempted && (
            <Alert variant="destructive">
              <AlertTitle>Resume not uploaded</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 3 error banner */}
          {error && step === 3 && (
            <Alert variant="destructive">
              <AlertTitle>Job description required</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        {/* NOTE: if you want to also surface rate-limit errors here on Step 4, you could add a banner similar to above. */}

          {/* Wizard nav */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={step === 1}
              className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            >
              Back
            </Button>

            <div className="flex items-center gap-2">
              {step < steps.length ? (
                <Button
                  onClick={onNext}
                  disabled={(step === 1 && !step1Valid) || (step === 3 && !step3Valid)}
                  className="bg-indigo-600 text-white hover:bg-indigo-500 cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={() => setStep(1)}
                  className="bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                >
                  Start Over
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    {showExpanded && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl">
          <button
            onClick={() => setShowExpanded(false)}
            className="absolute right-4 top-4 text-foreground/60 hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
          <pre className="whitespace-pre-wrap text-sm text-foreground">{aiText}</pre>
        </div>
      </div>
    )}
  </>
  );
}

/* ------------------------------ Subcomponents ----------------------------- */

function WizardSidebar({
  steps,
  current,
}: {
  steps: { id: number; title: string }[];
  current: number;
}) {
  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="rounded-2xl border border-border bg-card/60 p-4 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-foreground/60">
          Wizard
        </div>
        <nav className="space-y-2">
          {steps.map((s, idx) => {
            const active = current === s.id;
            return (
              <div
                key={s.id}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                  active
                    ? "border-indigo-500/40 bg-indigo-500/10 ring-1 ring-indigo-500/20"
                    : "border-border hover:bg-foreground/[0.05]"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs flex-shrink-0",
                    active ? "bg-indigo-600 text-white" : "bg-foreground/10 text-foreground/80"
                  )}
                >
                  {idx + 1}
                </span>
                <span className="truncate text-sm text-foreground">{s.title}</span>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

function StepContainer({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
      <header>
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Dropzone({
  onFile,
  fileName,
}: {
  onFile: (f: File) => void;
  fileName?: string;
}) {
  return (
    <label className="block cursor-pointer rounded-xl border border-dashed border-border bg-background/60 p-8 text-center shadow-sm transition-colors hover:bg-foreground/[0.04]">
      <input
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="mx-auto flex max-w-md flex-col items-center">
        <Upload className="mb-2 h-6 w-6 text-foreground/60" />
        <p className="text-sm text-foreground">
          {fileName ? `Selected: ${fileName}` : "Drag and drop your resume here"}
        </p>
        <p className="mt-1 text-xs text-foreground/60">PDF, DOC, or DOCX (max {MAX_SIZE_MB}MB)</p>
        <p className="mt-2 text-xs text-foreground/60">or click to choose a file</p>
      </div>
    </label>
  );
}