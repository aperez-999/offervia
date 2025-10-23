import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import ScannerPanel from "@/components/scanner/ScannerPanel";

export const metadata: Metadata = {
  title: "Job Description Scanner – Analyze and Optimize Applications",
  description:
    "Analyze job descriptions with Offervia's AI job scanner. Get insights on requirements, optimize your applications, and improve your job match success rate.",
  keywords: [
    "AI resume builder",
    "job description scanner",
    "resume tailoring",
    "career coach",
    "interview preparation",
    "Offervia",
    "job analysis",
    "AI job scanner",
    "job matching"
  ],
  openGraph: {
    title: "Job Description Scanner – Analyze and Optimize Applications",
    description:
      "Analyze job descriptions with Offervia's AI job scanner. Get insights on requirements, optimize your applications, and improve your job match success rate.",
    url: "https://offervia.com/scanner",
    siteName: "Offervia",
    images: [
      {
        url: "https://offervia.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "Offervia – AI Resume Builder"
      }
    ],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Job Description Scanner – Analyze and Optimize Applications",
    description:
      "Analyze job descriptions with Offervia's AI job scanner. Get insights on requirements, optimize your applications, and improve your job match success rate.",
    images: ["https://offervia.com/og-image.png"],
    creator: "@offervia"
  }
};

export default function ScannerPage() {
  return (
    <AuthGuard>
        <div className="p-6">
          <ScannerPanel />
        </div>
    </AuthGuard>
  );
}
