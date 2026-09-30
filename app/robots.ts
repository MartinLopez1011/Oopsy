/* ============================================================
   Robots.txt Generator — Oopsy
   
   Generates /robots.txt with crawler directives and sitemap reference.
   ============================================================ */
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/app/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/api/",
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
