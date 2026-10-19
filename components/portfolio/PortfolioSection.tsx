"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type {
  PortfolioFilterCategory,
  PortfolioProject,
} from "@/types/portfolio";
import PortfolioCard from "./PortfolioCard";
import PortfolioLightbox from "./PortfolioLightbox";
import { useReveal } from "@/app/hooks/useReveal";
import { trackEvent } from "@/app/lib/gtag";

/**
 * Categorías oficiales para el sistema de filtrado sin recargar la página
 */
export const PORTFOLIO_FILTER_TABS: readonly PortfolioFilterCategory[] = [
  "Todos",
  "Sesiones Fotográficas",
  "Eventos de Moda",
  "Cobertura Editorial",
];

interface PortfolioSectionProps {
  /** Lista de proyectos ya filtrados con `Estado === "Publicado"` en build time (SSG) */
  projects: PortfolioProject[];
  /** Título opcional de la sección */
  heading?: string;
  /** Subtítulo opcional */
  subheading?: string;
  /** Mostrar enlace al archivo completo cuando se renderiza resumido en el Home */
  showArchiveLink?: boolean;
}

export default function PortfolioSection({
  projects,
  heading = "Archivo Editorial",
  subheading = "Producción de moda, dirección de arte y cobertura visual seleccionada.",
  showArchiveLink = false,
}: PortfolioSectionProps) {
  const [activeCategory, setActiveCategory] =
    useState<PortfolioFilterCategory>("Todos");
  const [selectedProject, setSelectedProject] =
    useState<PortfolioProject | null>(null);

  const { ref: headerRef, isVisible: isHeaderVisible } = useReveal(0.1);

  // Filtrado reactivo en cliente sobre los datos estáticos pre-compilados
  const filteredProjects = useMemo(() => {
    if (activeCategory === "Todos") return projects;
    return projects.filter((project) => project.category === activeCategory);
  }, [projects, activeCategory]);

  // Conteo de proyectos por categoría para etiqueta de índice tipo lookbook
  const categoryCounts = useMemo(() => {
    const counts: Record<PortfolioFilterCategory, number> = {
      Todos: projects.length,
      "Sesiones Fotográficas": 0,
      "Eventos de Moda": 0,
      "Cobertura Editorial": 0,
    };
    for (const p of projects) {
      if (counts[p.category] !== undefined) {
        counts[p.category] += 1;
      }
    }
    return counts;
  }, [projects]);

  const handleCategoryChange = (category: PortfolioFilterCategory) => {
    setActiveCategory(category);
    trackEvent("filter_portfolio", {
      event_category: "Portfolio",
      event_label: category,
    });
  };

  const handleOpenProject = (project: PortfolioProject) => {
    setSelectedProject(project);
    trackEvent("open_portfolio_lightbox", {
      event_category: "Portfolio",
      event_label: `${project.id} - ${project.title}`,
    });
  };

  return (
    <section
      id="portafolio"
      aria-label="Portafolio Editorial Oopsy"
      className="relative overflow-hidden bg-surface px-5 py-24 md:px-8 md:py-32 lg:px-12 lg:py-40"
    >
      {/* Sutil textura de marca (patronaje de líneas editoriales) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage: "url('/images/patterns/stripes-light.png')",
          backgroundSize: "320px",
          backgroundRepeat: "repeat",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Cabecera Editorial (Amplio espacio negativo + Tipografía Melodrama) */}
        <div
          ref={headerRef}
          className={`reveal border-b border-border pb-10 md:pb-14 ${
            isHeaderVisible ? "visible" : ""
          }`}
        >
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2.5 text-[0.7rem] font-semibold tracking-[0.24em] text-text-muted uppercase font-body">
                <span className="h-1.5 w-1.5 rounded-full bg-dark" />
                <span>LOOKBOOK & ARCHIVE</span>
                <span className="text-border">/</span>
                <span>SSG EDITION</span>
              </div>

              <h2 className="mt-4 font-heading text-4xl font-normal leading-[1.04] tracking-tight text-text-heading sm:text-5xl md:text-6xl lg:text-[4.25rem]">
                {heading}{" "}
                <span className="italic font-light text-dark/75">Oopsy</span>
              </h2>
            </div>

            <p className="max-w-md text-sm font-light leading-relaxed text-text-muted font-body md:text-base">
              {subheading}
            </p>
          </div>

          {/* Sistema de Filtrado: Tabs minimalistas sin recargar la página */}
          <div
            role="tablist"
            aria-label="Filtrar proyectos por categoría"
            className="mt-10 flex flex-wrap items-center gap-2 sm:gap-3 md:mt-12"
          >
            {PORTFOLIO_FILTER_TABS.map((category) => {
              const isActive = activeCategory === category;
              const count = categoryCounts[category];

              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleCategoryChange(category)}
                  className={`group relative inline-flex items-center gap-2 border px-4 py-2 text-xs tracking-[0.18em] uppercase transition-all duration-300 font-body sm:px-5 sm:py-2.5 ${
                    isActive
                      ? "border-dark bg-dark text-neutral shadow-sm"
                      : "border-border bg-surface/80 text-text-body hover:border-dark/40 hover:text-dark"
                  }`}
                >
                  <span>{category}</span>
                  <span
                    className={`text-[0.65rem] transition-colors ${
                      isActive
                        ? "text-primary"
                        : "text-text-muted group-hover:text-dark/70"
                    }`}
                  >
                    ({String(count).padStart(2, "0")})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Grilla Asimétrica Responsiva (1 col mobile, 2 tablet, 3 desktop) */}
        {filteredProjects.length > 0 ? (
          <div className="mt-12 grid grid-cols-1 gap-y-14 sm:mt-16 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-20">
            {filteredProjects.map((project, index) => (
              <PortfolioCard
                key={project.id}
                project={project}
                index={index}
                onSelect={handleOpenProject}
              />
            ))}
          </div>
        ) : (
          <div className="my-20 border border-dashed border-border py-20 text-center">
            <p className="font-heading text-2xl text-text-heading">
              No hay producciones publicadas en esta categoría.
            </p>
            <p className="mt-2 text-sm text-text-muted font-body">
              Selecciona otra categoría para explorar el archivo editorial.
            </p>
          </div>
        )}

        {/* Footer de Sección / Link opcional al archivo completo */}
        {showArchiveLink && (
          <div className="mt-20 flex flex-col items-center justify-between gap-6 border-t border-border pt-10 sm:flex-row">
            <p className="text-xs tracking-[0.2em] text-text-muted uppercase font-body">
              MOSTRANDO {filteredProjects.length} PRODUCCIONES SELECCIONADAS
            </p>
            <Link
              href="/portafolio"
              className="group inline-flex items-center gap-3 border border-dark bg-dark px-7 py-3.5 text-xs font-medium tracking-[0.22em] text-neutral uppercase transition-all duration-300 hover:bg-primary hover:border-primary hover:text-dark"
            >
              <span>Explorar Archivo Completo</span>
              <svg
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        )}
      </div>

      {/* Modal Lightbox Inmersivo */}
      <PortfolioLightbox
        key={selectedProject?.id ?? "closed"}
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
      />
    </section>
  );
}
