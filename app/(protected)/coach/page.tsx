"use client";

import AuthGuard from "@/components/AuthGuard";
import CoachHub from "@/components/coach/CoachHub";

export default function CoachPage() {
  return (
    <AuthGuard>
        <CoachHub />
    </AuthGuard>
  );
}
