// app/sitemap.ts
import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Replace localhost with your production domain automatically
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  // Static pages — both public and SEO-relevant protected ones
  const routes = [
    "",
    "login",
    "signup",
    "templates",
    "resources",
    "contact",
    "resume",
    "scanner",
    "coach",
  ];

  const now = new Date().toISOString();

  return routes.map((path) => ({
    url: `${baseUrl}/${path}`,
    lastModified: now,
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1.0 : 0.6,
  }));
}