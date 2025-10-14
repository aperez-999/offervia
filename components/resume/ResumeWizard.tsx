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
  const [jd, setJd] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

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
            <StepContainer title="Tailor & Review" description="Your tailored resume will appear here after AI generation.">
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Your tailored resume will appear here after AI generation.
                </div>
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
              <Button variant="secondary" disabled>
                Generate with AI
              </Button>
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
