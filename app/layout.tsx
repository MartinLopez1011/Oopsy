/* ============================================================
   Root Layout — Oopsy
   
   Contiene los componentes compartidos (Navbar y Footer) que
   persisten en todas las páginas, además de metadata SEO,
   Google Search Console verification, JSON-LD estructurado y
   Google Analytics 4 (GA4).
   ============================================================ */
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import GoogleAnalytics from "@/app/components/GoogleAnalytics";
import JsonLd from "@/app/components/JsonLd";
import { getSiteUrl, getSiteUrlObject } from "@/app/lib/siteUrl";

const siteUrl = getSiteUrl();
const siteUrlObj = getSiteUrlObject();

const rawVerification = (
  process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ||
  process.env.GOOGLE_SITE_VERIFICATION
)?.trim();
const googleVerification =
  rawVerification && rawVerification !== "undefined" && rawVerification !== "null"
    ? rawVerification
    : undefined;

const rawGaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
const gaMeasurementId =
  rawGaId && rawGaId !== "undefined" && rawGaId !== "null" ? rawGaId : undefined;

/* ── SEO Metadata ── */
export const metadata: Metadata = {
  metadataBase: siteUrlObj,
  title: {
    default: "OOPSY — Creatividad sin límites | Agencia de Modelaje y Producción",
    template: "%s | OOPSY",
  },
  description:
    "Oopsy es una agencia de modelaje y producción creativa que transforma ideas en experiencias visuales únicas. Dirección creativa, producción visual de moda y estrategia de marca.",
  keywords: [
    "agencia de modelos",
    "agencia de modelaje",
    "modelos chile",
    "producción de moda",
    "agencia creativa",
    "dirección creativa",
    "producción visual",
    "estrategia de marca",
    "OOPSY",
    "branding",
    "diseño",
    "casting",
  ],
  authors: [{ name: "OOPSY", url: siteUrl }],
  creator: "OOPSY",
  publisher: "OOPSY",
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    title: "OOPSY — Creatividad sin límites | Agencia de Modelaje y Producción",
    description:
      "Transformamos ideas en experiencias visuales únicas que conectan con tu audiencia.",
    url: siteUrl,
    siteName: "OOPSY",
    locale: "es_CL",
    type: "website",
    images: [
      {
        url: "/images/hero-bg.jpg",
        width: 1200,
        height: 630,
        alt: "OOPSY — Creatividad sin límites",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OOPSY — Creatividad sin límites | Agencia de Modelaje y Producción",
    description:
      "Transformamos ideas en experiencias visuales únicas que conectan con tu audiencia.",
    images: ["/images/hero-bg.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: googleVerification
    ? {
        google: googleVerification,
      }
    : undefined,
  icons: {
    icon: [
      { url: "/images/icons/isotipo-pink.png", sizes: "1024x1024", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    shortcut: "/images/icons/isotipo-pink.png",
    apple: [
      { url: "/images/icons/isotipo-pink.png", sizes: "180x180", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="bg-surface font-body text-text-body antialiased">
        {/* ── Google Analytics 4 (GA4) ── */}
        <Suspense fallback={null}>
          <GoogleAnalytics gaId={gaMeasurementId} />
        </Suspense>

        {/* ── Structured Data (JSON-LD) ── */}
        <JsonLd siteUrl={siteUrl} />

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
