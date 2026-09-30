/* ============================================================
   Sitemap Generator — Oopsy
   
   Generates /sitemap.xml dynamically conforming to the Sitemaps XML protocol.
   ============================================================ */
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/app/lib/siteUrl";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
  ];
}
