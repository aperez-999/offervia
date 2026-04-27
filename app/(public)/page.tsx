import type { Metadata } from "next";
import { redirect } from "next/navigation";
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
  title: "Offervia",
  description:
    "Offervia helps job seekers move from job description to tailored resume, interview prep, and application tracking with one focused AI workflow.",
  path: "/",
});

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const code = typeof params.code === "string" ? params.code : null;
  const authError = typeof params.error === "string" ? params.error : null;

  if (code || authError) {
    const forwarded = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") forwarded.set(key, value);
      if (Array.isArray(value)) {
        value.forEach((item) => forwarded.append(key, item));
      }
    }
    redirect(`/auth/callback${forwarded.toString() ? `?${forwarded.toString()}` : ""}`);
  }

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
