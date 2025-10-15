import type { Metadata } from "next";
import LayoutPublic from "@/components/public/LayoutPublic";
import "../globals.css";

export const metadata: Metadata = {
  title: "Offervia – AI Career Suite",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <LayoutPublic>{children}</LayoutPublic>;
}
