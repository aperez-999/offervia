// components/resume/ResumeWizard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardCopy,
  Download,
  Trash2,
  Loader2,
  PenLine,
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
  Eye,
  Pencil,
  Printer,
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
import { printHtmlDocument } from "@/lib/print-pdf";
import {
  ResumeDocument,
  isLikelyStructuredResume,
  resumeToPrintHtml,
} from "@/components/resume/TailoredResumeDocument";
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
  const [generatedWithTemplate, setGeneratedWithTemplate] = useState<boolean | null>(null);
  const [showExpanded, setShowExpanded] = useState(false);
  const [packetContext, setPacketContext] = useState(false);
  const [outputView, setOutputView] = useState<"preview" | "edit">("preview");

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

    if (from === "job-packet") {
      const bits = [packetDraft.companyName, packetDraft.roleTitle].filter(Boolean).join(" · ");
      toast({ variant: "info",
        title: "Job details loaded from your packet",
        description: bits
          ? `${bits} and the job description are filled in. Upload your resume next.`
          : "The job description is filled in. Upload your resume next.",
      });
    }
    // Run once on arrival for the current URL params.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      toast({ variant: "info",
        title: "Job description loaded",
        description: "We copied it over from the Scanner.",
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
      setError("Upload a resume to continue.");
      return;
    }
    if (step === 3 && !step3Valid) {
      setError("The job description needs at least 20 characters.");
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
        description: "Upload a PDF or DOCX file.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > RESUME_MAX_SIZE_MB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `Files can be up to ${RESUME_MAX_SIZE_MB} MB.`,
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
    let autoAdvanced = false;
    try {
      const desired = localStorage.getItem(RESUME_DESIRED_STEP_LS_KEY);
      if (desired) {
        const parsed = Number(desired);
        if (Number.isFinite(parsed)) {
          const nextStep = Math.max(1, Math.min(resumeWizardSteps.length, Math.floor(parsed)));
          setStep(nextStep);
          autoAdvanced = nextStep > 1;
        }
        localStorage.removeItem(RESUME_DESIRED_STEP_LS_KEY);
      }
    } catch {
      // noop
    }

    toast({ variant: "success",
      title: "Resume added",
      description: packetContext
        ? autoAdvanced
          ? `${file.name} added with your job details. Skipping ahead to review.`
          : `${file.name} added with your job details.`
        : autoAdvanced
        ? `${file.name} uploaded. Skipping ahead to review.`
        : `${file.name} uploaded.`,
    });

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
          const msg = resp.error || "You've used today's free tailoring runs. Try again tomorrow.";
          setError(msg);
          toast({
            title: "Daily limit reached",
            description: msg,
            variant: "destructive",
          });
          return;
        }
        if (resp.status === 413) {
          const msg = "That file is too large to process. Try a shorter resume or a DOCX.";
          setError(msg);
          toast({ title: "File too large", description: msg, variant: "destructive" });
          return;
        }
        const generic =
          resp.error ||
          "Couldn't generate a draft. Wait a moment and try again, or shorten the job description.";
        setError(generic);
        toast({ title: "Draft not generated", description: generic, variant: "destructive" });
        return;
      }

      setAiText(String(resp.data?.content || ""));
      setOutputView("preview");
      setGeneratedWithTemplate(templateMode);
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
      toast({ variant: "success", title: "Draft ready", description: "Check facts and numbers before you send it." });
    } catch (e: unknown) {
      const msg = e instanceof Error && e.name === "AbortError"
        ? "The request timed out. Try again in a moment."
        : "Couldn't generate a draft. Wait a moment and try again, or shorten the job description.";
      setError(msg);
      toast({ title: "Draft not generated", description: msg, variant: "destructive" });
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
        description: "Add a company name and role title first.",
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
      () => toast({ variant: "success", title: label }),
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

  function saveAsPdf() {
    if (!aiText.trim()) return;
    const docTitle = [companyName, roleTitle].filter(Boolean).join(" - ") || "Tailored Resume";
    const html = resumeToPrintHtml(aiText, docTitle);
    const ok = printHtmlDocument(html);
    if (!ok) {
      toast({
        title: "Couldn't open the print dialog",
        description: "Use Download for a text copy, or try again.",
        variant: "destructive",
      });
    }
  }

  // targetingSummary removed - not used in current implementation

  const isPdf =
    !!resumeFileName &&
    (resumeFileName.toLowerCase().endsWith(".pdf") ||
      (resumeFile && resumeFile.type === "application/pdf"));

  // Fit the page to the iframe width; "zoom" is achieved by widening the
  // iframe (and letting FitH re-fit), which the native viewer renders crisply
  // and lets us center horizontally with mx-auto.
  const pdfSrc = previewUrl ? `${previewUrl}#toolbar=0&navpanes=0&view=FitH` : "";
  const zoomWidth = zoom === "fit" ? "100%" : `${zoom}%`;

  /* -------------------------------- Render -------------------------------- */

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <section>
        <p className="text-xs font-medium text-primary">Step 2 · Tailor</p>
        <h1 className="mt-1 text-xl sm:text-2xl font-semibold text-foreground">Resume Tailor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload your resume, add the job description, and get a version rewritten for that one role.
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
                <StepContainer title="Upload resume" description="PDF or DOCX.">
              <div className="space-y-3">
                {(() => {
                  const from = search.get("from") || "";
                  const fromScanner = from === "scanner" || from.startsWith("scanner");
                  return fromScanner && jd.trim().length >= 20 && !resumeFileName;
                })() && (
                    <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-sm text-success">
                    <div className="font-medium">Job description loaded</div>
                    <div className="mt-0.5 text-xs text-success/80">
                      Upload your resume to continue your Job Packet.
                    </div>
                  </div>
                )}
                {packetContext && !resumeFileName && (
                  <div className="rounded-lg border border-primary/30 bg-primary/10 p-3 text-sm">
                    <div className="flex items-center gap-1.5 font-medium text-primary">
                      <FileText className="h-3.5 w-3.5" /> Job details loaded from your packet
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {companyName && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-background/60 px-2 py-0.5 text-xs text-foreground/80">
                          <Building2 className="h-3 w-3" /> {companyName}
                        </span>
                      )}
                      {roleTitle && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-background/60 px-2 py-0.5 text-xs text-foreground/80">
                          <Briefcase className="h-3 w-3" /> {roleTitle}
                        </span>
                      )}
                      {jd.trim().length >= 20 && (
                        <span className="inline-flex items-center gap-1 rounded-md border border-primary/25 bg-background/60 px-2 py-0.5 text-xs text-foreground/80">
                          <FileText className="h-3 w-3" /> Job description
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-xs text-foreground/60">
                      Upload your resume and we&apos;ll skip ahead to the review step.
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
              title="Company and role"
              description="Optional. Adding these lets the draft use the company's name and the role's wording."
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
                    Leave blank to tailor from the job description alone.
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
              title="Job description"
              description="Paste the full posting, including requirements."
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
                  placeholder="Paste the full job description here…"
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
                    <AlertTitle>Job description too short</AlertTitle>
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
              title="Tailor and review"
              description="Your original is on the left. Generate the tailored version on the right, then edit it."
            >
              {/* Preview and AI output side-by-side on wide screens */}
              <div className="grid items-start gap-8 xl:grid-cols-2">
                {/* Top: File preview */}
                <div className="lg:row-span-1">
                  <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="text-sm font-medium text-foreground">Your resume</div>
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

                  <div className="h-[68vh] overflow-auto rounded-xl border border-border bg-neutral-200/70 shadow-sm dark:bg-neutral-800/60 dark:ring-black/10">
                    {resumeFile ? (
                      isPdf && previewUrl ? (
                        <iframe
                          key={zoomWidth}
                          src={pdfSrc}
                          title="PDF preview"
                          style={{ width: zoomWidth }}
                          className="mx-auto block h-full border-0 bg-transparent"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                          <FileText className="mb-3 h-6 w-6 text-foreground/50" />
                          <p className="text-sm text-foreground/80">{resumeFileName}</p>
                          <p className="text-xs text-foreground/60">{bytesToStr(resumeSize)}</p>
                          <p className="mt-3 text-xs text-foreground/60">
                            DOCX files can&apos;t be previewed here. Use &ldquo;Open in new tab&rdquo; to view the file.
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
                  <div className="flex flex-col gap-3 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-foreground">Tailored resume</h2>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={templateMode}
                          onClick={() => setTemplateMode((v) => !v)}
                          title="On: the draft uses a standard sectioned layout. Off: it keeps your original structure."
                          className="group inline-flex items-center gap-2 rounded-full border border-border bg-background/60 py-1 pl-1 pr-2.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-foreground/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          <span
                            className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                              templateMode ? "bg-primary" : "bg-foreground/25"
                            }`}
                          >
                            <span
                              className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                                templateMode ? "translate-x-3.5" : "translate-x-0.5"
                              }`}
                            />
                          </span>
                          Template format
                        </button>
                        {aiText && generatedWithTemplate !== null && generatedWithTemplate !== templateMode && (
                          <span className="hidden items-center rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning sm:inline-flex">
                            Regenerate to apply
                          </span>
                        )}
                      </div>
                      {aiText && (
                        <div className="inline-flex items-center rounded-lg border border-border bg-background/60 p-0.5 text-xs">
                          <button
                            type="button"
                            onClick={() => setOutputView("preview")}
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
                              outputView === "preview"
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground/70 hover:text-foreground"
                            }`}
                          >
                            <Eye className="h-3.5 w-3.5" /> Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => setOutputView("edit")}
                            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 transition-colors ${
                              outputView === "edit"
                                ? "bg-primary text-primary-foreground"
                                : "text-foreground/70 hover:text-foreground"
                            }`}
                          >
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-2">
                      <Button
                        size="sm"
                        disabled={!aiText}
                        className="h-8 bg-primary-button text-white hover:bg-primary-button/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        onClick={saveAsPdf}
                        title="Open a print dialog to save as PDF"
                      >
                        <Printer className="mr-1 h-4 w-4" />
                        Save as PDF
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!aiText}
                        className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
                        onClick={() => aiText && download(aiText, "tailored-resume.txt")}
                      >
                        <Download className="mr-1 h-4 w-4" />
                        .txt
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!aiText}
                        className="h-8 border-border text-foreground hover:bg-foreground/[0.06]"
                        onClick={() => aiText && copy(aiText, "Copied draft")}
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
                    outputView === "preview" && isLikelyStructuredResume(aiText) ? (
                      <div className="h-[68vh] overflow-auto rounded-xl border border-border bg-muted/40 p-4 shadow-sm">
                        <ResumeDocument text={aiText} />
                      </div>
                    ) : (
                      <Textarea
                        spellCheck
                        className="h-[68vh] resize-none rounded-xl border border-border bg-background/80 p-3 text-sm text-foreground placeholder:text-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        value={aiText}
                        onChange={(e) => setAiText(e.target.value)}
                      />
                    )
                  ) : (
                    <div className="flex h-[68vh] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card p-6 text-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-foreground">No draft yet</p>
                      <p className="mt-1 max-w-xs text-sm text-foreground/60">
                        Once your resume and job description are in, generate a draft.
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

                  {aiText && (
                    <p className="text-xs text-foreground/60">
                      AI wrote this draft. Check facts and numbers before you send it.
                    </p>
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
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rewriting your resume…
                        </>
                      ) : (
                        <>
                          <PenLine className="mr-2 h-4 w-4" />
                          Generate tailored draft
                        </>
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      disabled={!aiText}
                      className="border-border cursor-pointer text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      onClick={addToTracker}
                      title="Create a tracker entry prefilled from this job"
                    >
                      Add to tracker
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
                  Start over
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    {showExpanded && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
        <div className="relative flex w-full max-w-4xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <h3 className="text-sm font-semibold text-foreground">Tailored resume</h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-8 bg-primary-button text-white hover:bg-primary-button/90"
                onClick={saveAsPdf}
              >
                <Printer className="mr-1 h-4 w-4" /> Save as PDF
              </Button>
              <button
                onClick={() => setShowExpanded(false)}
                className="rounded-md p-1.5 text-foreground/60 hover:bg-foreground/[0.06] hover:text-foreground"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>
          <div className="overflow-y-auto bg-muted/40 p-4 sm:p-6">
            {isLikelyStructuredResume(aiText) ? (
              <ResumeDocument text={aiText} />
            ) : (
              <pre className="whitespace-pre-wrap font-sans text-sm text-foreground">{aiText}</pre>
            )}
          </div>
        </div>
      </div>
    )}
  </>
  );
}
