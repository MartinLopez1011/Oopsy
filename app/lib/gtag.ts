/* ============================================================
   Google Analytics 4 (GA4) Helper Utilities — Oopsy
   ============================================================ */

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

/**
 * Log a pageview to Google Analytics.
 * Safely guards against missing window object, empty URL, or missing ID,
 * queueing standard gtag.js arguments in dataLayer if gtag is not yet loaded.
 */
export const pageview = (url: string, id?: string) => {
  const rawId = (id || GA_MEASUREMENT_ID)?.trim();
  const measurementId =
    rawId && rawId !== "undefined" && rawId !== "null" ? rawId : undefined;

  if (typeof window === "undefined" || !measurementId || !url) {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  window.gtag("config", measurementId, {
    page_path: url,
  });
};

/**
 * Log a custom event to Google Analytics.
 * Safely guards against missing window object and prevents unbounded memory buffering
 * when GA is disabled by checking for an active measurement ID or existing gtag instance.
 */
export const trackEvent = (
  action: string,
  params?: Record<string, unknown>
) => {
  if (typeof window === "undefined" || !action) {
    return;
  }

  // If analytics is disabled and no gtag instance exists, skip queueing to prevent memory leaks
  if (!GA_MEASUREMENT_ID && typeof window.gtag !== "function") {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
  }

  if (params) {
    window.gtag("event", action, params);
  } else {
    window.gtag("event", action);
  }
};
