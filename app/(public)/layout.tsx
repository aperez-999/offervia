import type { Metadata } from "next";
import LayoutPublic from "@/components/public/LayoutPublic";
import "../globals.css";

export const metadata: Metadata = {
  title: "Offervia – AI Career Suite",
  description: "AI resume builder, interview coach, and job search tools built for job seekers.",
  keywords: ["resume tailoring", "interview prep", "job description scanner", "job search AI", "ATS resume"],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  openGraph: {
    title: "Offervia – AI Career Suite",
    description: "AI resume builder, interview coach, and job search tools built for job seekers.",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    siteName: "Offervia",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Offervia" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Offervia – AI Career Suite",
    description: "AI resume builder, interview coach, and job search tools built for job seekers.",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/og-image.png`],
  },
  icons: { icon: "/favicon.ico" },
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <LayoutPublic>{children}</LayoutPublic>;
}
