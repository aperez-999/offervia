"use client";

import AuthGuard from "@/components/AuthGuard";
import AppLayout from "@/components/layout/AppLayout";
import CoachHub from "@/components/coach/CoachHub";

export default function CoachPage() {
  return (
    <AuthGuard>
      <AppLayout>
        <CoachHub />
      </AppLayout>
    </AuthGuard>
  );
}
