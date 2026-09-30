"use client";

/* ============================================================
   Google Analytics 4 (GA4) Script Component — Oopsy
   
   Loads Google tag script (gtag.js) only when a valid GA ID is
   configured. Listens to route changes and records pageviews.
   ============================================================ */
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { pageview } from "@/app/lib/gtag";

interface GoogleAnalyticsProps {
  gaId?: string;
}

export default function GoogleAnalytics({
  gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
}: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const rawId = gaId?.trim();
  const id = rawId && rawId !== "undefined" && rawId !== "null" ? rawId : undefined;

  // Initialize with current pathname or fallback to browser location if on client.
  // This prevents false positive route-change triggers during hydration when usePathname()
  // might initially be null or undefined before resolving to "/".
  const initialPath = pathname || (typeof window !== "undefined" ? window.location.pathname : "/");
  const lastPathname = useRef<string | null>(initialPath);

  useEffect(() => {
    if (!id || !pathname) return;

    // Skip initial mount, React StrictMode remounts, and same-page re-renders.
    // The inline script handles the initial pageview on page load.
    if (lastPathname.current === pathname) {
      return;
    }

    lastPathname.current = pathname;
    pageview(pathname, id);
  }, [pathname, id]);

  if (!id) {
    return null;
  }

  return (
    <>
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            window.gtag = window.gtag || gtag;
            gtag('js', new Date());
            gtag('config', ${JSON.stringify(id)}, {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <Script
        id="google-analytics-tag"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`}
      />
    </>
  );
}
