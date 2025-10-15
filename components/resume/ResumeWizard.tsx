"use client";

import React, { useMemo, useState } from "react";
import { WizardSidebar } from "./WizardSidebar";
import { StepContainer } from "./StepContainer";
import Dropzone from "./Dropzone";
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
      <section>
        <h1 className="text-2xl font-semibold text-gray-900">Resume Tailor</h1>
        <p className="text-sm text-gray-600 mt-1">Follow the steps to tailor your resume to a job posting.</p>
      </section>

      <Progress value={progress} className="h-2" />

      <div className="flex gap-6">
        <WizardSidebar steps={steps} current={step} />

        <div className="flex-1 space-y-6">
          {step === 1 && (
            <StepContainer title="Upload Resume" description="Upload a PDF or DOCX file.">
              <div className="space-y-3">
                <Dropzone onFile={onFileSelected} fileName={resumeFileName} />
              </div>
            </StepContainer>
          )}

          {step === 2 && (
            <StepContainer title="Paste Job Description" description="Paste the job posting text below.">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Job description</label>
                <Textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the full job description here..."
                  className="min-h-[180px]"
                />
                <div className="text-xs text-gray-500">{jd.length} characters</div>
                {error && step === 2 && (
                  <Alert variant="destructive">
                    <AlertTitle>Missing or too short job description</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </div>
            </StepContainer>
          )}

          {step === 3 && (
            <StepContainer title="Tailor & Review" description="Generate a tailored version and review side-by-side.">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Original Resume (preview)</div>
                  <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700 min-h-[220px]">
                    {resumeFileName ? (
                      <p className="text-gray-600">Uploaded file: {resumeFileName}</p>
                    ) : (
                      <p className="text-gray-500">No file uploaded.</p>
                    )}
                    <p className="mt-2 text-xs text-gray-500">(Full text preview not shown for large files.)</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">AI Tailored Resume</div>
                  </div>
                  {aiText ? (
                    <textarea
                      className="w-full min-h-[260px] rounded-md border border-gray-200 p-2 text-sm"
                      value={aiText}
                      onChange={(e) => setAiText(e.target.value)}
                    />
                  ) : (
                    <div className="rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-700 min-h-[260px]">
                      <p className="text-gray-500">No AI resume yet. Click Generate to create one.</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="secondary"
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
                    } catch (e) {
                      // simple alert to avoid adding new components
                      alert("Failed to generate resume. Please try again.");
                    } finally {
                      setGenerating(false);
                    }
                  }}
                >
                  {generating ? "Generating..." : "Generate with AI"}
                </Button>
                <Button
                  variant="outline"
                  disabled={!aiText}
                  onClick={() => {
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
                  onClick={() => {
                    // Accept & Replace could later push to storage; for now keep in UI
                    alert("Accepted. You can copy or download the tailored version.");
                  }}
                >
                  Accept & Replace
                </Button>
              </div>
            </StepContainer>
          )}

          {error && step === 1 && attempted && (
            <Alert variant="destructive">
              <AlertTitle>Resume not uploaded</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onBack} disabled={step === 1}>
              Back
            </Button>
            <div className="flex items-center gap-2">
              {step < steps.length ? (
                <Button onClick={onNext} disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid)}>
                  Continue
                </Button>
              ) : (
                <Button onClick={() => setStep(1)}>Start Over</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
