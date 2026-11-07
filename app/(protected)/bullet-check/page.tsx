import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import BulletChecker from "@/components/bullets/BulletChecker";

export const metadata: Metadata = createPageMetadata({
  title: "Bullet checker",
  description: "Check resume bullets for weak openers, missing numbers, filler, and length.",
  path: "/bullet-check",
  index: false,
});

export default function BulletCheckPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Bullet check"
        description="Paste your bullets to see which need a stronger verb, a number, or fewer words."
      />
      <BulletChecker />
    </PageContainer>
  );
}
