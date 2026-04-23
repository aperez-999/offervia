import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const ResumeWizard = dynamic(() => import("@/components/resume/ResumeWizard"), {
  loading: () => (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="space-y-2">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    </div>
  ),
});

export const metadata: Metadata = {
  title: "Resume Tailor – AI-Powered Resume Customization",
  description:
    "Customize your resume for any job with Offervia's AI resume tailor. Get personalized recommendations and optimize your resume for better job matches.",
  keywords: [
    "AI resume builder",
    "job description scanner",
    "resume tailoring",
    "career coach",
    "interview preparation",
    "Offervia",
    "resume customization",
    "AI resume tailor"
  ],
  openGraph: {
    title: "Resume Tailor – AI-Powered Resume Customization",
    description:
      "Customize your resume for any job with Offervia's AI resume tailor. Get personalized recommendations and optimize your resume for better job matches.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/resume`,
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
    title: "Resume Tailor – AI-Powered Resume Customization",
    description:
      "Customize your resume for any job with Offervia's AI resume tailor. Get personalized recommendations and optimize your resume for better job matches.",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/og-image.png`],
    creator: "@offervia"
  }
};

export default function ResumePage() {
  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      <ResumeWizard />
    </div>
  );
}
