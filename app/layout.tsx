import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OOPSY — Agencia de Modelaje",
  description:
    "Estamos preparando algo increíble. OOPSY, agencia de modelaje. Sitio en construcción.",
  keywords: ["agencia de modelaje", "modelos", "OOPSY", "fashion", "agency"],
  openGraph: {
    title: "OOPSY — Agencia de Modelaje",
    description: "Estamos preparando algo increíble. Sitio en construcción.",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body className="bg-ivory text-ink font-sans">{children}</body>
    </html>
  );
}
