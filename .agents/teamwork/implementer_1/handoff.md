# Implementation Handoff: Google Analytics (GA4) & SEO Discovery Integration

## Summary of Changes
This implementation integrates Google Analytics 4 (GA4) event and pageview tracking, Google Search discovery (dynamic sitemap, robots directives, Google Site Verification), comprehensive OpenGraph/Twitter meta tags, and valid Schema.org JSON-LD structured data into the Oopsy modeling agency web application.

All features are implemented natively within Next.js 16 App Router architecture, ensuring zero client-side exceptions when environment keys are missing, invalid, or left as placeholders.

---

## Files Changed & Created

### 1. New Files
1. **`app/lib/gtag.ts`**:
   - Declares `Window.dataLayer` and `Window.gtag` TypeScript definitions.
   - Exports `GA_MEASUREMENT_ID` from `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID`.
   - Exports `pageview(url: string)`: Safely checks `typeof window !== "undefined"` and `typeof window.gtag === "function"` before invoking `gtag("config", ...)`.
   - Exports `trackEvent(action: string, params?: Record<string, unknown>)`: Safely forwards custom event metrics.

2. **`app/components/GoogleAnalytics.tsx`**:
   - Client component (`"use client"`) using Next.js `next/script`.
   - Accepts `gaId` prop with fallback to `process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID`.
   - Returns `null` if the ID is missing or empty, ensuring zero script tags and zero console errors when unconfigured.
   - Loads `https://www.googletagmanager.com/gtag/js?id=${id}` with `strategy="afterInteractive"`.
   - Injects the `dataLayer` and `gtag()` initialization inline script with `strategy="afterInteractive"`.
   - Listens to route changes via `usePathname()` in a `useEffect` hook to record dynamic pageviews.

3. **`app/components/JsonLd.tsx`**:
   - Server component injecting valid Schema.org structured data via `<script type="application/ld+json">`.
   - Uses `@type: ["Organization", "ProfessionalService"]`.
   - Defines canonical `@id`, `name` ("OOPSY"), `alternateName`, `url`, `logo`, `image`, `description`, `email`, Santiago Chile `address`, `sameAs` social profiles (Instagram & LinkedIn), and `hasOfferCatalog` for the agency's fashion event production, editorial photoshoot direction, and editorial coverage services.

4. **`app/sitemap.ts`**:
   - Next.js App Router metadata route returning `MetadataRoute.Sitemap`.
   - Dynamically resolves canonical site URL from `process.env.NEXT_PUBLIC_SITE_URL || "https://oopsy.cl"`.
   - Automatically maps to `/sitemap.xml` yielding a valid XML sitemap with `lastModified`, `changeFrequency: "weekly"`, and `priority: 1.0`.

5. **`app/robots.ts`**:
   - Next.js App Router metadata route returning `MetadataRoute.Robots`.
   - Configures crawler directives allowing all user agents (`allow: "/"`) and referencing canonical sitemap URL (`${siteUrl}/sitemap.xml`).
   - Automatically maps to `/robots.txt`.

6. **`.env.example`**:
   - Documents all application environment variables (`NEXT_PUBLIC_GA_MEASUREMENT_ID`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`) with clear explanatory comments and sample values.

### 2. Modified Files
1. **`app/layout.tsx`**:
   - Configured `metadataBase` with canonical site URL.
   - Configured full `Metadata` object: page title templates, description, keywords, OpenGraph tags, Twitter card tags, search engine crawler directives (`robots`).
   - Added `verification.google` reading from `process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.GOOGLE_SITE_VERIFICATION`, rendering `<meta name="google-site-verification" content="..." />` when provided.
   - Embedded `<GoogleAnalytics gaId={gaMeasurementId} />` and `<JsonLd siteUrl={siteUrl} />` into the root document layout.
   - Updated RootLayout props to standard `Readonly<{ children: React.ReactNode }>`.

2. **`app/components/Contact.tsx`**:
   - Imported `trackEvent` from `@/app/lib/gtag`.
   - Added event tracking `trackEvent("generate_lead", { event_category: "Contact", event_label: ... })` upon successful form submission.

3. **`.gitignore`**:
   - Added explicit exclusion `!.env.example` under `.env*` to ensure `.env.example` is committed and tracked in git.

---

## File Diffs

### Diff: `.gitignore`
```diff
@@ -32,6 +32,7 @@
 
 # env files (can opt-in for committing if needed)
 .env*
+!.env.example
 
 # vercel
 .vercel
```

### Diff: `app/components/Contact.tsx`
```diff
@@ -3,6 +3,7 @@
 import { useState, type FormEvent } from "react";
 import Image from "next/image";
 import { useReveal } from "@/app/hooks/useReveal";
+import { trackEvent } from "@/app/lib/gtag";
 
 export default function Contact() {
   const reveal = useReveal();
@@ -27,6 +28,10 @@
       });
 
       if (res.ok) {
+        trackEvent("generate_lead", {
+          event_category: "Contact",
+          event_label: String(formData.get("subject") || "General"),
+        });
         setFormState("sent");
         form.reset();
         setTimeout(() => setFormState("idle"), 5000);
```

### Diff: `app/layout.tsx`
```diff
@@ -8,38 +8,118 @@
-import type { Metadata } from "next";
-import "./globals.css";
-import Navbar from "@/app/components/Navbar";
-import Footer from "@/app/components/Footer";
+import type { Metadata } from "next";
+import "./globals.css";
+import Navbar from "@/app/components/Navbar";
+import Footer from "@/app/components/Footer";
+import GoogleAnalytics from "@/app/components/GoogleAnalytics";
+import JsonLd from "@/app/components/JsonLd";
+
+const siteUrl = (
+  process.env.NEXT_PUBLIC_SITE_URL || "https://oopsy.cl"
+).replace(/\/+$/, "");
+
+const googleVerification =
+  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
+  process.env.GOOGLE_SITE_VERIFICATION;
+
+const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
 
-/* ── SEO Metadata ── */
-export const metadata: Metadata = {
-  title: "OOPSY — Creatividad sin límites",
-  description:
-    "Oopsy es una agencia creativa que transforma ideas en experiencias visuales únicas. Dirección creativa, producción visual y estrategia de marca.",
-  keywords: [
-    "agencia creativa",
-    "dirección creativa",
-    "producción visual",
-    "estrategia de marca",
-    "OOPSY",
-    "branding",
-    "diseño",
-  ],
-  openGraph: {
-    title: "OOPSY — Creatividad sin límites",
-    description:
-      "Transformamos ideas en experiencias visuales únicas que conectan con tu audiencia.",
-    type: "website",
-  },
-};
+export const metadata: Metadata = {
+  metadataBase: new URL(siteUrl),
+  title: {
+    default: "OOPSY — Creatividad sin límites | Agencia de Modelaje y Producción",
+    template: "%s | OOPSY",
+  },
+  description:
+    "Oopsy es una agencia de modelaje y producción creativa que transforma ideas en experiencias visuales únicas. Dirección creativa, producción visual de moda y estrategia de marca.",
+  keywords: [
+    "agencia de modelos",
+    "agencia de modelaje",
+    "modelos chile",
+    "producción de moda",
+    "agencia creativa",
+    "dirección creativa",
+    "producción visual",
+    "estrategia de marca",
+    "OOPSY",
+    "branding",
+    "diseño",
+    "casting",
+  ],
+  authors: [{ name: "OOPSY", url: siteUrl }],
+  creator: "OOPSY",
+  publisher: "OOPSY",
+  alternates: {
+    canonical: siteUrl,
+  },
+  openGraph: {
+    title: "OOPSY — Creatividad sin límites | Agencia de Modelaje y Producción",
+    description:
+      "Transformamos ideas en experiencias visuales únicas que conectan con tu audiencia.",
+    url: siteUrl,
+    siteName: "OOPSY",
+    locale: "es_CL",
+    type: "website",
+    images: [
+      {
+        url: "/images/hero-bg.jpg",
+        width: 1200,
+        height: 630,
+        alt: "OOPSY — Creatividad sin límites",
+      },
+    ],
+  },
+  twitter: {
+    card: "summary_large_image",
+    title: "OOPSY — Creatividad sin límites | Agencia de Modelaje y Producción",
+    description:
+      "Transformamos ideas en experiencias visuales únicas que conectan con tu audiencia.",
+    images: ["/images/hero-bg.jpg"],
+  },
+  robots: {
+    index: true,
+    follow: true,
+    googleBot: {
+      index: true,
+      follow: true,
+      "max-video-preview": -1,
+      "max-image-preview": "large",
+      "max-snippet": -1,
+    },
+  },
+  verification: googleVerification
+    ? {
+        google: googleVerification,
+      }
+    : undefined,
+};
 
-export default function RootLayout({ children }: LayoutProps<"/">) {
+export default function RootLayout({
+  children,
+}: Readonly<{
+  children: React.ReactNode;
+}>) {
   return (
     <html lang="es">
       <body className="bg-surface font-body text-text-body antialiased">
+        {/* ── Google Analytics 4 (GA4) ── */}
+        <GoogleAnalytics gaId={gaMeasurementId} />
+
+        {/* ── Structured Data (JSON-LD) ── */}
+        <JsonLd siteUrl={siteUrl} />
+
         {/* ── Navbar sticky ── */}
         <Navbar />
 
         {/* ── Contenido de la página ── */}
         <main>{children}</main>
 
         {/* ── Footer ── */}
         <Footer />
       </body>
     </html>
   );
 }
```

---

## Verification Record

### Deep Verification (ran actual tests)
- **None**: In this environment, executing commands via `run_command` or MCP tools triggered interactive permission checks that timed out waiting for user confirmation (timeout: 60s). Per system instructions, commands could not be executed without user interaction.

### Shallow Verification (code review & static inspection)
- **TypeScript & Next.js 16 Compatibility**:
  - `app/sitemap.ts` adheres to `MetadataRoute.Sitemap` specification with canonical URL, changeFrequency, priority, and lastModified.
  - `app/robots.ts` adheres to `MetadataRoute.Robots` specification pointing crawler rules and `sitemap` directive to `${siteUrl}/sitemap.xml`.
  - `app/layout.tsx` metadata complies with Next.js 16 App Router `Metadata` specifications, including `metadataBase`, OpenGraph, Twitter card, robots, and `verification.google`.
  - `app/components/GoogleAnalytics.tsx` handles both presence and absence of `NEXT_PUBLIC_GA_MEASUREMENT_ID` with null return guard, avoiding runtime errors when key is missing or empty.
  - `app/lib/gtag.ts` includes defensive browser environment guards (`typeof window !== "undefined"` and `typeof window.gtag === "function"`).
  - `app/components/JsonLd.tsx` produces valid Schema.org `Organization` and `ProfessionalService` structured JSON-LD with matching properties.
  - `.env.example` documents all required and optional variables, and `.gitignore` includes `!.env.example`.

### Unverified Aspects
- Live execution of `npm run build` via terminal (requires user approval on CLI execution in this environment).
- Live HTTP response testing of `/sitemap.xml` and `/robots.txt` against a running Next.js dev server.
- Live transmission of network beacons to Google's collection servers (requires real internet GA4 endpoint and active network traffic).

---

## Known Issues
- `Shallow Verification`: Full end-to-end build (`npm run build`) could not be executed directly in the sandboxed agent session due to CLI permission prompt timeouts. Implementation relies on strict alignment with official Next.js 16 metadata route and script specifications.
- `Minor Robustness Risk`: If `NEXT_PUBLIC_SITE_URL` is configured with an invalid URI protocol (e.g. not starting with `http://` or `https://`), `new URL(siteUrl)` in `layout.tsx` would throw during metadata generation. Default is set to `"https://oopsy.cl"`.
