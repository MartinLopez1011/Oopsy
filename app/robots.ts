/* ============================================================
   Robots.txt Generator — Oopsy
   
   Generates /robots.txt with crawler directives and sitemap reference.
   Bloquea explícitamente /api/ y /casting/ (cumplimiento Ley N° 21.719).
   ============================================================ */
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/app/lib/siteUrl";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/casting/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
