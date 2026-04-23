import type { Metadata } from "next";
import CoachHub from "@/components/coach/CoachHub";

export const metadata: Metadata = {
  title: "Career AI Coach – Interview Prep and Job Strategy",
  description:
    "Get personalized career coaching with Offervia's AI career coach. Practice interviews, get job strategy advice, and accelerate your career growth.",
  keywords: [
    "AI resume builder",
    "job description scanner",
    "resume tailoring",
    "career coach",
    "interview preparation",
    "Offervia",
    "AI career coach",
    "interview prep",
    "career strategy"
  ],
  openGraph: {
    title: "Career AI Coach – Interview Prep and Job Strategy",
    description:
      "Get personalized career coaching with Offervia's AI career coach. Practice interviews, get job strategy advice, and accelerate your career growth.",
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/coach`,
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
    title: "Career AI Coach – Interview Prep and Job Strategy",
    description:
      "Get personalized career coaching with Offervia's AI career coach. Practice interviews, get job strategy advice, and accelerate your career growth.",
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/og-image.png`],
    creator: "@offervia"
  }
};

export default function CoachPage() {
  return <CoachHub />;
}
