import type { Metadata } from "next";
import {
  SITE_DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_SHARE_IMAGE,
  SITE_SHARE_IMAGE_ALT,
  absoluteUrl,
} from "@/lib/site";

type CreatePageMetadataOptions = {
  title?: string;
  description?: string;
  path?: string;
  index?: boolean;
};

export function createPageMetadata({
  title,
  description = SITE_DESCRIPTION,
  path = "/",
  index = true,
}: CreatePageMetadataOptions = {}): Metadata {
  const pageUrl = absoluteUrl(path);
  const normalizedTitle = title?.trim();
  const isBrandTitle = !normalizedTitle || normalizedTitle === SITE_NAME;
  const socialTitle = isBrandTitle
    ? SITE_DEFAULT_TITLE
    : `${normalizedTitle} | ${SITE_NAME}`;

  return {
    title: isBrandTitle ? { absolute: SITE_DEFAULT_TITLE } : normalizedTitle,
    description,
    alternates: {
      canonical: pageUrl,
    },
    robots: index
      ? undefined
      : {
          index: false,
          follow: false,
        },
    openGraph: {
      title: socialTitle,
      description,
      url: pageUrl,
      siteName: SITE_NAME,
      images: [
        {
          url: absoluteUrl(SITE_SHARE_IMAGE),
          width: 1200,
          height: 630,
          alt: SITE_SHARE_IMAGE_ALT,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: socialTitle,
      description,
      images: [absoluteUrl(SITE_SHARE_IMAGE)],
    },
  };
}
