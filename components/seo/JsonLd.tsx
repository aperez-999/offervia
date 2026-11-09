import {
  SITE_NAME,
  SITE_DESCRIPTION,
  getSiteUrl,
  absoluteUrl,
} from "@/lib/site";

/**
 * Structured data (JSON-LD) for rich results. Rendered as inline scripts.
 * Kept free of fabricated ratings/reviews to stay within Google's guidelines.
 */

function JsonLdScript({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Organization + WebSite — safe to render site-wide. */
export function OrganizationJsonLd() {
  const url = getSiteUrl();
  const logo = absoluteUrl("/apple-icon");

  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url,
    logo,
    description: SITE_DESCRIPTION,
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url,
    publisher: { "@type": "Organization", name: SITE_NAME, logo },
  };

  return (
    <>
      <JsonLdScript data={organization} />
      <JsonLdScript data={website} />
    </>
  );
}

/** SoftwareApplication — use on the marketing landing page. */
export function SoftwareApplicationJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web",
    url: getSiteUrl(),
    description: SITE_DESCRIPTION,
    image: absoluteUrl("/og-image.png"),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to use.",
    },
    featureList: [
      "Job posting keyword scan",
      "Resume tailoring",
      "Resume bullet checker",
      "Cover letters",
      "Mock interviews",
      "Application tracker",
      "Offer comparison",
      "Student Hub with templates and student deals",
    ],
  };

  return <JsonLdScript data={data} />;
}
