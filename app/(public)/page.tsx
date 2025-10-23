import type { Metadata } from "next";
import Hero from "@/components/public/Hero";
import Features from "@/components/public/Features";
import Why from "@/components/public/Why";
import Testimonials from "@/components/public/Testimonials";
import Faq from "@/components/public/Faq";
import HowItWorks from "@/components/public/HowItWorks";
import BottomCta from "@/components/public/BottomCta";
import Footer from "@/components/public/Footer";

export const metadata: Metadata = {
  title: "Offervia – AI Resume Builder & Job Tailoring Tool",
  description:
    "Offervia helps you stand out with AI-powered resume tailoring, job description scanning, and interview prep. Build your career smarter.",
  keywords: [
    "AI resume builder",
    "job description scanner",
    "resume tailoring",
    "career coach",
    "interview preparation",
    "Offervia"
  ],
  openGraph: {
    title: "Offervia – Smarter Career Tools",
    description:
      "AI-powered resume tailoring, job scan insights, and interview coaching to help you land your dream job.",
    url: "https://offervia.com",
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
    title: "Offervia – AI Resume Builder & Job Tailoring",
    description:
      "Build your dream career with AI-powered resume tailoring and job scanning tools.",
    images: ["https://offervia.com/og-image.png"],
    creator: "@offervia"
  }
};

export default function HomePage() {
  return (
    <div>
      <Hero />
      <Features />
      <Why />
      <Testimonials />
      <Faq />
      <HowItWorks />
      <BottomCta />
      <Footer />
    </div>
  );
}
