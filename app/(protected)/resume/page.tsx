"use client";

import type { Metadata } from "next";
import AuthGuard from "@/components/AuthGuard";
import ResumeWizard from "@/components/resume/ResumeWizard";

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
    url: "https://offervia.com/resume",
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
    title: "Resume Tailor – AI-Powered Resume Customization",
    description:
      "Customize your resume for any job with Offervia's AI resume tailor. Get personalized recommendations and optimize your resume for better job matches.",
    images: ["https://offervia.com/og-image.png"],
    creator: "@offervia"
  }
};

export default function ResumePage() {
  return (
    <AuthGuard>
        <div className="p-6 space-y-6">
          <ResumeWizard />
        </div>
    </AuthGuard>
  );
}
