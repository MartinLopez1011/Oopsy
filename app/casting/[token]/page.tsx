/* ============================================================
   OOPSY — Private B2B Casting Package Route (/casting/[token])
   (app/casting/[token]/page.tsx)

   Reglas estrictas de seguridad y privacidad (Ley N° 21.719):
   1. Renderizado dinámico en cada solicitud (`dynamic = "force-dynamic"`) para
      evaluar en tiempo real `expires_at` y generar Cloudinary Signed URLs
      frescas con expiración de 15 a 30 minutos.
   2. Anti-indexación total: directiva `robots: { index: false, follow: false }`
      combinada con la cabecera HTTP `X-Robots-Tag: noindex, nofollow` en `next.config.ts`.
   3. Validación de token, vigencia y PIN en el servidor mediante `getCastingPackage(token)`.
   ============================================================ */

import type { Metadata } from "next";
import { getCastingPackage } from "@/lib/repository";
import CastingPackageClient from "@/components/casting/CastingPackageClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Casting Package Confidencial | Acceso Privado B2B",
  description:
    "Material confidencial exclusivo para evaluación de casting. Prohibida su descarga, difusión o almacenamiento no autorizado (Ley N° 21.719).",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

interface CastingPackagePageProps {
  params: Promise<{ token: string }>;
}

export default async function CastingPackagePage({
  params,
}: CastingPackagePageProps) {
  const { token } = await params;
  const initialResolution = await getCastingPackage(token);

  return (
    <div className="pt-14 md:pt-16">
      <CastingPackageClient initialResolution={initialResolution} />
    </div>
  );
}
