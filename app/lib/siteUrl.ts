/* ============================================================
   Site URL Normalization Utility — Oopsy
   ============================================================ */

export const DEFAULT_SITE_URL = "https://oopsy.cl";

/**
 * Normalizes a raw URL string into a well-formed canonical URL without trailing slashes.
 * Automatically adds the https:// protocol if missing (e.g. "oopsy.cl" -> "https://oopsy.cl"),
 * handles localhost/IP addresses, and falls back safely to DEFAULT_SITE_URL on invalid input.
 */
export function normalizeSiteUrl(rawUrl?: string | null): string {
  if (!rawUrl || typeof rawUrl !== "string") {
    return DEFAULT_SITE_URL;
  }

  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return DEFAULT_SITE_URL;
  }

  // Prepend protocol if missing
  let withProtocol = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(trimmed)) {
      withProtocol = `http://${trimmed}`;
    } else {
      withProtocol = `https://${trimmed}`;
    }
  }

  try {
    const parsed = new URL(withProtocol);
    // Disallow non-http/https protocols (e.g. ftp, javascript, data)
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return DEFAULT_SITE_URL;
    }
    // Origin must be valid and non-null
    if (!parsed.hostname || parsed.origin === "null") {
      return DEFAULT_SITE_URL;
    }
    const cleanPath = parsed.pathname === "/" ? "" : parsed.pathname.replace(/\/+$/, "");
    return `${parsed.origin}${cleanPath}`;
  } catch {
    return DEFAULT_SITE_URL;
  }
}

/**
 * Returns the application's canonical site URL as a normalized string.
 */
export function getSiteUrl(): string {
  return normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL);
}

/**
 * Returns the application's canonical site URL as a valid URL object.
 * Guaranteed never to throw TypeError: Invalid URL.
 */
export function getSiteUrlObject(): URL {
  return new URL(getSiteUrl());
}
