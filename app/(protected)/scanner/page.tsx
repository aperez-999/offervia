"use client";

import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";
import ScannerWizard from "@/components/scanner/ScannerWizard";

export default function ScannerPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6">
          <ScannerWizard />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
