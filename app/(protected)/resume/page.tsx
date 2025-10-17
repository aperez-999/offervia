"use client";

import AuthGuard from "@/components/AuthGuard";
import ResumeWizard from "@/components/resume/ResumeWizard";

export default function ResumePage() {
  return (
    <AuthGuard>
        <div className="p-6 space-y-6">
          <ResumeWizard />
        </div>
    </AuthGuard>
  );
}
