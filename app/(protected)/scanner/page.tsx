"use client";

import AuthGuard from "@/components/AuthGuard";
import ScannerPanel from "@/components/scanner/ScannerPanel";

export default function ScannerPage() {
  return (
    <AuthGuard>
        <div className="p-6">
          <ScannerPanel />
        </div>
    </AuthGuard>
  );
}
