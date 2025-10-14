"use client";

import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";
import ScannerPanel from "@/components/scanner/ScannerPanel";

export default function ScannerPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6">
          <ScannerPanel />
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
