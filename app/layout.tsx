/* ============================================================
   Root Layout — Oopsy
   
   Contiene los componentes compartidos (Navbar y Footer) que
   persisten en todas las páginas, además de metadata SEO.
   
   📌 TIPOGRAFÍAS PERSONALIZADAS:
   Si deseas cargar tus fuentes locales (Melodrama, Author, etc.),
   puedes importarlas aquí con next/font/local o agregarlas al CSS.
   ============================================================ */
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

/* ── SEO Metadata ── */
export const metadata: Metadata = {
  title: "OOPSY — Creatividad sin límites",
  description:
    "Oopsy es una agencia creativa que transforma ideas en experiencias visuales únicas. Dirección creativa, producción visual y estrategia de marca.",
  keywords: [
    "agencia creativa",
    "dirección creativa",
    "producción visual",
    "estrategia de marca",
    "OOPSY",
    "branding",
    "diseño",
  ],
  openGraph: {
    title: "OOPSY — Creatividad sin límites",
    description:
      "Transformamos ideas en experiencias visuales únicas que conectan con tu audiencia.",
    type: "website",
    /* 📌 Agrega tu URL real aquí: */
    /* url: "https://oopsy.com", */
    /* images: [{ url: "/images/og-image.jpg", width: 1200, height: 630 }], */
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body className="bg-surface font-body text-text-body antialiased">
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
