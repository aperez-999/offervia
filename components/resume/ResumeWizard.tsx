// components/resume/ResumeWizard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
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
  CheckCircle2,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { postForm } from "@/lib/safe-fetch"; // uses your safeFetch helper
import {
  buildTrackerDraftFromPacket,
  hasMeaningfulJobPacketDraft,
  readJobPacketDraft,
  updateJobPacketDraft,
} from "@/lib/job-packet";
import Dropzone from "@/components/resume/Dropzone";
import StepContainer from "@/components/resume/StepContainer";
import WizardSidebar from "@/components/resume/WizardSidebar";
import {
  approxTokens,
  bytesToStr,
  detectTechs,
  normalizeText,
  RESUME_ACCEPTED_TYPES,
  RESUME_DESIRED_STEP_LS_KEY,
  RESUME_JD_LS_KEY,
  RESUME_MAX_SIZE_MB,
  resumeWizardSteps,
} from "@/components/resume/wizard-utils";

/* ------------------------------- Component ------------------------------- */

export default function ResumeWizard({ defaultRole = "" }: { defaultRole?: string }) {
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
  const [roleTitle, setRoleTitle] = useState(defaultRole);
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
  const [packetContext, setPacketContext] = useState(false);

  // PDF zoom
  const [zoom, setZoom] = useState<"fit" | "110" | "125" | "150">("fit");

  // Err/UI
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  // restore JD draft from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RESUME_JD_LS_KEY);
      if (raw) setJd(raw);
    } catch {}
  }, []);

  useEffect(() => {
    const from = search.get("from") || "";
    const packetDraft = readJobPacketDraft();
    const shouldHydrate = from === "job-packet" || hasMeaningfulJobPacketDraft(packetDraft);
    if (!shouldHydrate || !packetDraft) return;

    setPacketContext(true);
    setCompanyName((prev) => prev || packetDraft.companyName);
    setRoleTitle((prev) => prev || packetDraft.roleTitle);
    setLocation((prev) => prev || packetDraft.location);
    setCompanyUrl((prev) => prev || packetDraft.companyUrl);
    setJd((prev) => {
      if (from === "job-packet" && packetDraft.jobDescription.trim()) {
        return packetDraft.jobDescription;
      }
      return prev || packetDraft.jobDescription;
    });
  }, [search]);

  // Allow deep-linking into a step (used by Job Packet handoff from Scanner)
  useEffect(() => {
    const stepRaw = search.get("step");
    if (!stepRaw) return;
    const parsed = Number(stepRaw);
    if (!Number.isFinite(parsed)) return;
    const next = Math.max(1, Math.min(resumeWizardSteps.length, Math.floor(parsed)));
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
  // Prefill role/company when deep-linked from an application workspace.
  useEffect(() => {
    const role = search.get("role");
    const company = search.get("company");
    if (role) setRoleTitle(role);
    if (company) setCompanyName(company);
  }, [search]);
  useEffect(() => {
    try {
      localStorage.setItem(RESUME_JD_LS_KEY, jd);
    } catch {}
  }, [jd]);

  useEffect(() => {
    if (!packetContext) return;
    updateJobPacketDraft({
      currentStep: "resume",
      companyName,
      roleTitle,
      location,
      companyUrl,
      jobDescription: jd,
      trackerDraft: buildTrackerDraftFromPacket({ companyName, roleTitle }),
    });
  }, [companyName, companyUrl, jd, location, packetContext, roleTitle]);

  useEffect(() => {
    if (!packetContext || !aiText.trim()) return;
    updateJobPacketDraft({
      currentStep: "tracker",
      tailoredResume: aiText,
      trackerDraft: buildTrackerDraftFromPacket({ companyName, roleTitle }),
    });
  }, [aiText, companyName, packetContext, roleTitle]);

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

  const progress = useMemo(() => (step / resumeWizardSteps.length) * 100, [step]);
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
    setStep((s) => Math.min(s + 1, resumeWizardSteps.length));
  }

  function onBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  /* -------------------------------- Upload -------------------------------- */

  function onFileSelected(file: File) {
    const ext = "." + (file.name.split(".").pop() || "").toLowerCase();
    if (!(RESUME_ACCEPTED_TYPES as readonly string[]).includes(ext)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF, DOC, or DOCX.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > RESUME_MAX_SIZE_MB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Max size is ${RESUME_MAX_SIZE_MB}MB.`,
        variant: "destructive",
      });
      return;
    }

    setResumeFileName(file.name);
    setResumeFile(file);
    setResumeSize(file.size);
    setAiText(""); // clear AI output if new file
    if (packetContext) {
      updateJobPacketDraft({
        currentStep: "resume",
        resumeFileName: file.name,
      });
    }

    // If the user came from the Scanner Job Packet handoff, auto-advance once a resume exists.
    try {
      const desired = localStorage.getItem(RESUME_DESIRED_STEP_LS_KEY);
      if (desired) {
        const parsed = Number(desired);
        if (Number.isFinite(parsed)) {
          const nextStep = Math.max(1, Math.min(resumeWizardSteps.length, Math.floor(parsed)));
          setStep(nextStep);
        }
        localStorage.removeItem(RESUME_DESIRED_STEP_LS_KEY);
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
    if (packetContext) {
      updateJobPacketDraft({ resumeFileName: "" });
    }
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
                className="cursor-pointer bg-primary-button text-primary-button-foreground hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
      if (packetContext) {
        updateJobPacketDraft({
          currentStep: "tracker",
          companyName,
          roleTitle,
          location,
          companyUrl,
          jobDescription: jd,
          tailoredResume: String(resp.data?.content || ""),
          resumeFileName,
          trackerDraft: buildTrackerDraftFromPacket({ companyName, roleTitle }),
        });
      }
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
    params.set("from", "job-packet");
    if (packetContext) {
      updateJobPacketDraft({
        currentStep: "tracker",
        companyName,
        roleTitle,
        location,
        companyUrl,
        jobDescription: jd,
        tailoredResume: aiText,
        resumeFileName,
        trackerDraft: {
          company,
          position,
          status: "Applied",
          applied_on: new Date().toISOString().slice(0, 10),
        },
      });
    }
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
    <div className="space-y-6">
      {/* Header */}
      <section>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">Step 2 · Tailor</p>
        <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-foreground">Resume Tailor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Move through the steps to tailor one resume draft to one role with cleaner, more consistent context.
        </p>
      </section>

      <Progress value={progress} className="h-2" />

      {/* Responsive layout: wizard rail for input steps, full-width workspace on review */}
      <div className={`grid grid-cols-1 gap-4 lg:gap-8 ${step === 4 ? "" : "lg:grid-cols-[16rem_minmax(0,1fr)]"}`}>
      {step !== 4 && <WizardSidebar steps={[...resumeWizardSteps]} current={step} />}

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
                    <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                    <div className="font-medium">Job description loaded</div>
                    <div className="mt-0.5 text-xs text-success/80">
                      Upload your resume to keep the Job Packet moving.
                    </div>
                  </div>
                )}
                <Dropzone
                  onFile={onFileSelected}
                  fileName={resumeFileName}
                  accept={RESUME_ACCEPTED_TYPES.join(",")}
                  maxSizeMb={RESUME_MAX_SIZE_MB}
                />
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
                  className="min-h-[220px] bg-background/80 text-foreground placeholder:text-foreground/40 border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
              {/* Preview and AI output side-by-side on wide screens */}
              <div className="grid items-start gap-8 xl:grid-cols-2">
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

                  <div className="h-[68vh] overflow-hidden rounded-xl border border-border bg-background/60 shadow-sm ring-1 ring-white/5 dark:ring-black/10">
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
                          className="h-4 w-4 accent-primary"
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
                      className="h-[68vh] resize-none rounded-xl border border-border bg-background/80 p-3 text-sm text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                    />
                  ) : (
                    <div className="flex h-[68vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-foreground">No tailored draft yet</p>
                      <p className="mt-1 max-w-xs text-sm text-foreground/60">
                        Generate an AI-tailored version once your resume and job description are ready.
                      </p>
                      <div className="mt-4 flex flex-col gap-1.5 text-xs">
                        <span className={`inline-flex items-center gap-1.5 ${resumeFile ? "text-success" : "text-foreground/50"}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Resume uploaded
                        </span>
                        <span className={`inline-flex items-center gap-1.5 ${jd.trim().length >= 20 ? "text-success" : "text-foreground/50"}`}>
                          <CheckCircle2 className="h-3.5 w-3.5" /> Job description added
                        </span>
                      </div>
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
                      className="bg-primary-button cursor-pointer text-white hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {generating ? (
                        <>
                          <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                          Generating…
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Generate tailored draft
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      disabled={!aiText}
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={() => {
                        toast({
                          title: "Draft accepted",
                          description: "You can keep editing here, copy it out, or send it to the tracker next.",
                        });
                      }}
                    >
                      Mark as ready
                    </Button>

                    <Button
                      variant="outline"
                      disabled={!aiText}
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={addToTracker}
                      title="Create a tracker entry prefilled from this job"
                    >
                      Send to Tracker
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
              className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Back
            </Button>

            <div className="flex items-center gap-2">
              {step < resumeWizardSteps.length ? (
                <Button
                  onClick={onNext}
                  disabled={(step === 1 && !step1Valid) || (step === 3 && !step3Valid)}
                  className="bg-primary-button text-white hover:bg-primary-button/90 cursor-pointer focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  Continue
                </Button>
              ) : (
                <Button
                  onClick={() => setStep(1)}
                  className="bg-primary-button text-white hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
