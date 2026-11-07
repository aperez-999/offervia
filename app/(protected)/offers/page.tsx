import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/metadata";
import { PageContainer, PageHeader } from "@/components/layout/Page";
import OfferCompare from "@/components/offers/OfferCompare";

export const metadata: Metadata = createPageMetadata({
  title: "Compare offers",
  description: "Compare job offers side by side: first-year pay, pay after rent, commute time, and real hourly pay.",
  path: "/offers",
  index: false,
});

export default function OffersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Compare offers"
        description="The bigger salary isn't always the better offer. Put two or three side by side, with rent and commute counted."
      />
      <OfferCompare />
    </PageContainer>
  );
}
