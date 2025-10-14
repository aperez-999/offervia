"use client";

import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import UploadZone from "./UploadZone";
import { Upload, FileSearch, CheckCircle } from "lucide-react";

const steps = [
  { id: 1, title: "Upload Job Description", icon: Upload },
  { id: 2, title: "Preview & Info", icon: FileSearch },
  { id: 3, title: "Results", icon: CheckCircle },
];

export default function ScannerWizard() {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);

  const progress = useMemo(() => (step / steps.length) * 100, [step]);
  const canContinue = step === 1 ? !!fileName : true;

  function onNext() {
    setAttempted(true);
    setError(null);
    if (step === 1 && !fileName) {
      setError("Please upload a job description before continuing.");
      return;
    }
    setStep((s) => Math.min(s + 1, steps.length));
  }
  function onBack() {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  }

  return (
    <div className="space-y-6">
      {/* Top heading */}
      <section className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900">Job Description Scanner</h1>
        <p className="text-sm text-gray-600 mt-1">Upload and preview a JD, then analyze with AI.</p>
      </section>

      {/* Horizontal stepper */}
      <div className="mx-auto max-w-xl">
        <div className="flex items-center justify-between text-sm text-gray-700">
          {steps.map((s) => {
            const active = s.id === step;
            const Icon = s.icon;
            return (
              <div key={s.id} className={`flex items-center gap-2 ${active ? "font-medium" : ""}`}>
                <Icon className="h-4 w-4" />
                <span>{s.title}</span>
              </div>
            );
          })}
        </div>
        <Progress value={progress} className="mt-2 h-2" />
      </div>

      {/* Center card content */}
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-900">{steps[step - 1].title}</CardTitle>
            <CardDescription className="text-gray-600">
              {step === 1 && "Upload a PDF, DOC, or DOCX of the job description."}
              {step === 2 && "Confirm details before analyzing with AI."}
              {step === 3 && "Results will appear here after analysis."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === 1 && (
              <UploadZone onFile={(f) => setFileName(f.name)} fileName={fileName} />
            )}
            {step === 2 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-700">File selected</div>
                <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                  {fileName || "No file selected"}
                </div>
                <Alert>
                  <AlertTitle className="text-gray-800">Ready to analyze with AI</AlertTitle>
                  <AlertDescription className="text-gray-600">
                    This is a placeholder. The AI analysis will identify keywords and gaps.
                  </AlertDescription>
                </Alert>
              </div>
            )}
            {step === 3 && (
              <div className="space-y-3">
                <div className="text-sm text-gray-600">
                  Your analysis results will appear here. Use the AI to extract keywords and skill gaps.
                </div>
                <Button variant="secondary" disabled className="cursor-not-allowed">
                  Generate with AI
                </Button>
              </div>
            )}

            {error && step === 1 && attempted && (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Upload required</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Button variant="outline" onClick={onBack} disabled={step === 1}>
              Back
            </Button>
            <div className="flex items-center gap-2">
              {step < steps.length ? (
                <Button onClick={onNext} disabled={!canContinue}>
                  Continue
                </Button>
              ) : (
                <Button onClick={() => setStep(1)}>Start Over</Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
