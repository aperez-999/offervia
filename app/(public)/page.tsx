import type { Metadata } from "next";
import Hero from "@/components/public/Hero";
import ProofBar from "@/components/public/ProofBar";
import Features from "@/components/public/Features";
import Why from "@/components/public/Why";
import Testimonials from "@/components/public/Testimonials";
import Faq from "@/components/public/Faq";
import HowItWorks from "@/components/public/HowItWorks";
import BottomCta from "@/components/public/BottomCta";
import Footer from "@/components/public/Footer";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "AI Job Search Copilot",
  description:
    "Turn job descriptions into stronger applications with Job Packet, Resume Tailor, AI Coach, and Application Tracker in one focused workflow.",
  path: "/",
});

export default function HomePage() {
  return (
    <div className="relative">
      <Hero />
      <ProofBar />
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
