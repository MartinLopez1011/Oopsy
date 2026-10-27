/* ============================================================
   OOPSY — Public Editorial Talent Showcase (/talentos)
   (app/talentos/page.tsx)

   Capa Pública (Cumplimiento Ley N° 21.719):
   - Consume `getPublicModels()` desde `lib/repository.ts`.
   - Jamás serializa ni expone al cliente medidas sensibles (busto, cintura,
     cadera, calzado, peso), datos de contacto ni fotografías Polaroids/Digitals.
   - Todas las fotografías del Book incluyen `fl_strip_profile` y resolución
     contenida (`w_1200,q_auto,f_auto`).
   ============================================================ */

import type { Metadata } from "next";
import { getPublicModels } from "@/lib/repository";
import TalentGrid from "@/components/talents/TalentGrid";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Talentos & Modelos | Representación Editorial",
  description:
    "Conoce el roster de modelos y talentos representados por Oopsy: editorial de alta costura, pasarela, rostro comercial y new faces.",
};

export default async function TalentosPage() {
  const publicTalents = await getPublicModels();

  return (
    <div className="pt-16 md:pt-20">
      <TalentGrid talents={publicTalents} />
    </div>
  );
}
