import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Settings",
  description: "Manage preferences, exports, notifications, and account details for your Offervia workspace.",
  path: "/settings",
  index: false,
});

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
