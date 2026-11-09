import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Hero from "@/components/public/Hero";
import HubBand from "@/components/public/HubBand";
import HowItWorks from "@/components/public/HowItWorks";
import BottomCta from "@/components/public/BottomCta";
import Footer from "@/components/public/Footer";
import { SoftwareApplicationJsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Offervia",
  description:
    "Free job search tools for students and new grads. Paste a posting, see what your resume is missing, and fix it before you apply.",
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
      <SoftwareApplicationJsonLd />
      <Hero />
      <HowItWorks />
      <HubBand />
      <BottomCta />
      <Footer />
    </div>
  );
}
