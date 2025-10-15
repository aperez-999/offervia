import Hero from "@/components/public/Hero";
import Features from "@/components/public/Features";
import Why from "@/components/public/Why";
import HowItWorks from "@/components/public/HowItWorks";
import BottomCta from "@/components/public/BottomCta";
import Footer from "@/components/public/Footer";

export default function HomePage() {
  return (
    <div>
      <Hero />
      <Features />
      <Why />
      <HowItWorks />
      <BottomCta />
      <Footer />
    </div>
  );
}
