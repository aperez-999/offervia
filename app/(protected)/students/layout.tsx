import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Student Exclusives",
  description: "Find curated student tools, discounts, and resources that fit alongside your Offervia workflow.",
  path: "/students",
  index: false,
});

export default function StudentsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
