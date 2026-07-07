// app/robots.ts
import type { MetadataRoute } from "next";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard/",
          "/job-packet/",
          "/resume/",
          "/cover-letter/",
          "/scanner/",
          "/coach/",
          "/interview/",
          "/settings/",
          "/profile/",
          "/student-hub/",
          "/tracker/",
          "/upgrade/",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
