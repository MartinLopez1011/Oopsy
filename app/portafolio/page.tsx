/* ============================================================
   OOPSY — Dedicated Editorial Portfolio Page (/portafolio)
   100% Static Site Generation (SSG) en Build Time.
   ============================================================ */
import type { Metadata } from "next";
import PortfolioSection from "@/components/portfolio/PortfolioSection";
import { getPortfolioProjects } from "@/lib/portfolio";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Portafolio Editorial | Lookbook & Producciones",
  description:
    "Explora el archivo editorial de Oopsy: sesiones fotográficas de alta costura, producción de desfiles, eventos de moda y cobertura insider.",
};

export default async function PortfolioPage() {
  const projects = await getPortfolioProjects();

  return (
    <div className="pt-16 md:pt-20">
      <PortfolioSection
        projects={projects}
        heading="Portafolio Editorial"
        subheading="Archivo completo de campañas, sesiones fotográficas, pasarelas y cobertura editorial producidas por Oopsy."
        showArchiveLink={false}
      />
    </div>
  );
}
