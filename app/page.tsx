import Hero from "@/app/components/Hero";
import Marquee from "@/app/components/Marquee";
import Services from "@/app/components/Services";
import PortfolioSection from "@/components/portfolio/PortfolioSection";
import Contact from "@/app/components/Contact";
import { getPortfolioProjects } from "@/lib/portfolio";

export default async function Home() {
  const featuredProjects = await getPortfolioProjects({
    onlyFeaturedInHome: true,
  });

  return (
    <>
      <Hero />
      <Marquee />
      <Services />
      <PortfolioSection
        projects={featuredProjects}
        heading="Portafolio Editorial"
        subheading="Selección curada de sesiones fotográficas, producción de pasarelas y cobertura editorial para marcas de moda."
        showArchiveLink={true}
      />
      <Contact />
    </>
  );
}
