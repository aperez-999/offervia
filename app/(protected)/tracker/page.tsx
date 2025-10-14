"use client";

import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";

export default function TrackerPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <h1 className="text-xl font-semibold text-gray-900">Job Tracker</h1>
        {/* TODO: Add breadcrumb trail here */}
      </AppLayout>
    </AuthGuard>
  );
}
