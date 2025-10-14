"use client";

import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";
import ResumeWizard from "@/components/resume/ResumeWizard";

export default function ResumePage() {
  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6 space-y-6">
          <ResumeWizard />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
