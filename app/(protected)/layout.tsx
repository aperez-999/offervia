// app/(protected)/layout.tsx
import type { ReactNode } from "react";

export default function ProtectedLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}