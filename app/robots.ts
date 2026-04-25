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
          "/scanner/",
          "/coach/",
          "/settings/",
          "/profile/",
          "/resources/",
          "/students/",
          "/templates/",
          "/tracker/",
          "/upgrade/",
          "/upcoming/",
        ],
      },
    ],
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
