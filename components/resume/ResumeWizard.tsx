"use client";

import React, { useMemo, useState } from "react";
import { Upload } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const steps = [
  { id: 1, title: "Upload Resume" },
  { id: 2, title: "Job Description" },
  { id: 3, title: "Tailor & Review" },
];

export default function ResumeWizard() {
  const [step, setStep] = useState(1);
  const [resumeFileName, setResumeFileName] = useState<string>("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jd, setJd] = useState<string>("");
  const [aiText, setAiText] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [generating, setGenerating] = useState(false);

  const progress = useMemo(() => (step / steps.length) * 100, [step]);
  const step1Valid = !!resumeFileName;
  const step2Valid = jd.trim().length >= 20;

  function onNext() {
    setAttempted(true);
    setError(null);
    if ((step === 1 && !step1Valid) || (step === 2 && !step2Valid)) {
      setError(
        step === 1
          ? "Please upload a resume before continuing."
          : "Job description must be at least 20 characters."
      );
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length));
  }

  function onBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  function onFileSelected(file: File) {
    setResumeFileName(file.name);
    setResumeFile(file);
    setAiText(""); // clear AI output if new file
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-semibold text-foreground">Resume Tailor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Follow the steps to tailor your resume to a job posting.
        </p>
      </section>

      <Progress value={progress} className="h-2" />

      <div className="flex gap-6">
        <WizardSidebar steps={steps} current={step} />

        <div className="flex-1 space-y-6">
          {/* Step 1 */}
          {step === 1 && (
            <StepContainer title="Upload Resume" description="Upload a PDF or DOCX file.">
              <div className="space-y-3">
                <Dropzone onFile={onFileSelected} fileName={resumeFileName} />
              </div>
            </StepContainer>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <StepContainer
              title="Paste Job Description"
              description="Paste the job posting text below."
            >
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Job description</label>
                <Textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="min-h-[180px] bg-background/80 text-foreground placeholder:text-foreground/40 border-border focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                />
                <div className="text-xs text-foreground/60">{jd.length} characters</div>
                {error && step === 2 && (
                  <Alert variant="destructive">
                    <AlertTitle>Missing or too short job description</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </StepContainer>
          )}

          {/* Step 3 */}
          {step === 3 && (
            <StepContainer
              title="Tailor & Review"
              description="Generate a tailored version and review side-by-side."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* Original preview */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-foreground">Original Resume (preview)</div>
                  <div className="min-h-[220px] rounded-xl border border-border bg-card/60 p-3 text-sm text-foreground shadow-sm ring-1 ring-white/5 dark:ring-black/10">
                    {resumeFileName ? (
                      <p className="text-foreground/90">Uploaded file: {resumeFileName}</p>
                    ) : (
                      <p className="text-foreground/60">No file uploaded.</p>
                    )}
                    <p className="mt-2 text-xs text-foreground/60">
                      (Full text preview not shown for large files.)
                    </p>
                  </div>
                </div>

                {/* AI tailored */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-foreground">AI Tailored Resume</div>
                  </div>

                  {aiText ? (
                    <textarea
                      className="w-full min-h-[260px] rounded-xl border border-border bg-background/80 p-2 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-black"
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                    />
                  ) : (
                    <div className="min-h-[260px] rounded-xl border border-border bg-card/60 p-3 text-sm text-foreground shadow-sm ring-1 ring-white/5 dark:ring-black/10">
                      <p className="text-foreground/60">No AI resume yet. Click Generate to create one.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2">
                <Button
                  disabled={generating || !resumeFile || jd.trim().length < 20}
                  onClick={async () => {
                    if (!resumeFile || jd.trim().length < 20) return;
                    setGenerating(true);
                    try {
                      const fd = new FormData();
                      fd.append("file", resumeFile);
                      fd.append("jobDescription", jd);
                      const res = await fetch("/api/resume-tailor", { method: "POST", body: fd });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data?.error || "Failed");
                      setAiText(String(data.content || ""));
                    } catch {
                      alert("Failed to generate resume. Please try again.");
                    } finally {
                      setGenerating(false);
                    }
                  }}
                  className="bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                >
                  {generating ? "Generating..." : "Generate with AI"}
                </Button>

                <Button
                  variant="outline"
                  disabled={!aiText}
                  className="border-border text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                  onClick={() => {
                    if (!aiText) return;
                    const blob = new Blob([aiText], { type: "text/plain;charset=utf-8" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "tailored-resume.txt";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Download as TXT
                </Button>

                <Button
                  variant="outline"
                  disabled={!aiText}
                  className="border-border text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
                  onClick={() => {
                    alert("Accepted. You can copy or download the tailored version.");
                  }}
                >
                  Accept & Replace
                </Button>
              </div>
            </StepContainer>
          )}

          {/* Step 1 error banner */}
          {error && step === 1 && attempted && (
            <Alert variant="destructive">
              <AlertTitle>Resume not uploaded</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Wizard nav */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={onBack}
              disabled={step === 1}
              className="border-border text-foreground hover:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
            >
              Back
            </Button>

            <div className="flex items-center gap-2">
              {step < steps.length ? (
                <Button
                  onClick={onNext}
                  disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}
                  className="bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-black"
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
  );
}

/* ------------------------------------------------------------------ */
/* Inline subcomponents (tokenized, dark-mode friendly)                */
/* ------------------------------------------------------------------ */

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function WizardSidebar({
  steps,
  current,
}: {
  steps: { id: number; title: string }[];
  current: number;
}) {
  return (
    <aside className="w-72 shrink-0">
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
                    "flex h-6 w-6 items-center justify-center rounded-full text-xs",
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
        accept=".pdf,.doc,.docx"
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
        <p className="mt-1 text-xs text-foreground/60">PDF, DOC, or DOCX</p>
        <p className="mt-2 text-xs text-foreground/60">or click to choose a file</p>
      </div>
    </label>
  );
}