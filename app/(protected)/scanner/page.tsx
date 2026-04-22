import type { Metadata } from "next";
import dynamic from "next/dynamic";
import AuthGuard from "@/components/AuthGuard";
import { Skeleton } from "@/components/ui/skeleton";

const ScannerPanel = dynamic(() => import("@/components/scanner/ScannerPanel"), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="space-y-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  ),
});

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
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/scanner`,
    siteName: "Offervia",
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/og-image.png`,
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
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/og-image.png`],
    creator: "@offervia"
  }
};

export default function ScannerPage() {
  return (
    <AuthGuard>
      <div className="p-4 sm:p-6">
        <ScannerPanel />
      </div>
    </AuthGuard>
  );
}
