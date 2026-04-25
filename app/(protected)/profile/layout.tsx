import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Profile",
  description: "Update your name, avatar, and profile details used across your Offervia workspace.",
  path: "/profile",
  index: false,
});

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
