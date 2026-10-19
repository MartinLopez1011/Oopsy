"use client";

import Image from "next/image";
import type { PortfolioProject, EditorialAspectRatio } from "@/types/portfolio";

interface PortfolioCardProps {
  project: PortfolioProject;
  index: number;
  onSelect: (project: PortfolioProject) => void;
}

/**
 * Mapeo de proporciones editoriales sin recortar rostros ni prendas.
 * Respeta formatos verticales (3:4, 4:5) y horizontales (16:10).
 */
const ASPECT_RATIO_CLASSES: Record<EditorialAspectRatio, string> = {
  "3:4": "aspect-[3/4]",
  "4:5": "aspect-[4/5]",
  "16:10": "aspect-[16/10]",
  "1:1": "aspect-square",
};

/**
 * Desplazamiento vertical sutil en desktop para acentuar el ritmo de lookbook
 * en grillas asimétricas de 3 columnas.
 */
function getEditorialOffsetClass(index: number): string {
  const mod = index % 3;
  if (mod === 1) return "lg:mt-12";
  if (mod === 2) return "lg:mt-6";
  return "";
}

export default function PortfolioCard({
  project,
  index,
  onSelect,
}: PortfolioCardProps) {
  const aspectClass =
    ASPECT_RATIO_CLASSES[project.aspectRatio] || "aspect-[3/4]";
  const offsetClass = getEditorialOffsetClass(index);
  const indexLabel = String(index + 1).padStart(2, "0");

  return (
    <article
      className={`group relative flex flex-col ${offsetClass}`}
      data-project-id={project.id}
      data-category={project.category}
    >
      {/* Editorial Top Meta Row (Lookbook index + Categoría) */}
      <div className="mb-2.5 flex items-center justify-between text-[0.68rem] tracking-[0.22em] text-text-muted uppercase font-body">
        <span className="font-medium text-dark/45">
          {indexLabel} <span className="mx-1 text-border">/</span> {project.id}
        </span>
        <span className="truncate pl-3 text-dark/60">{project.category}</span>
      </div>

      {/* Interactive Image Frame */}
      <button
        type="button"
        onClick={() => onSelect(project)}
        aria-label={`Abrir galería editorial de ${project.title} — ${project.client}`}
        className={`relative w-full overflow-hidden bg-neutral-dark text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-dark focus-visible:ring-offset-4 ${aspectClass}`}
      >
        <Image
          src={project.coverImage}
          alt={`${project.title} — ${project.client} (${project.category})`}
          fill
          priority={index < 3}
          unoptimized={project.coverImage.includes("res.cloudinary.com")}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          placeholder="blur"
          blurDataURL={project.blurDataURL}
          className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Badge táctil visible en mobile/tablet (donde no existe hover) */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-dark-deep/75 via-dark-deep/25 to-transparent px-4 pt-10 pb-3.5 text-neutral md:hidden"
          aria-hidden="true"
        >
          <span className="inline-flex items-center gap-1.5 border border-neutral/25 bg-dark-deep/60 px-2.5 py-1 text-[0.62rem] font-medium tracking-[0.2em] uppercase backdrop-blur-md">
            <span>{project.gallery.length} FOTOS</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-medium tracking-[0.18em] text-primary uppercase">
            <span>Ver sesión</span>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
              />
            </svg>
          </span>
        </div>

        {/* Overlay sutil revelado en hover para desktop (microinteracción duration-500) */}
        <div
          className="pointer-events-none absolute inset-0 hidden flex-col justify-between bg-gradient-to-t from-dark-deep/85 via-dark-deep/25 to-transparent p-6 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 md:flex md:p-7"
          aria-hidden="true"
        >
          {/* Top badge inside overlay */}
          <div className="flex items-center justify-between">
            {project.monthYear ? (
              <span className="inline-block border border-neutral/30 bg-dark-deep/40 px-2.5 py-1 text-[0.62rem] font-medium tracking-[0.22em] text-neutral uppercase backdrop-blur-md">
                {project.monthYear}
              </span>
            ) : (
              <span />
            )}
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral/30 bg-neutral/10 text-neutral backdrop-blur-md transition-transform duration-500 group-hover:rotate-45">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.75}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25"
                />
              </svg>
            </span>
          </div>

          {/* Bottom project metadata inside overlay */}
          <div className="translate-y-3 transition-transform duration-500 ease-out group-hover:translate-y-0">
            {project.client && (
              <p className="text-[0.68rem] font-medium tracking-[0.24em] text-primary uppercase font-body">
                {project.client}
              </p>
            )}
            <h3 className="mt-1.5 font-heading text-2xl font-normal leading-[1.12] tracking-tight text-neutral md:text-[1.65rem]">
              {project.title}
            </h3>
            <div className="mt-3 flex items-center justify-between border-t border-neutral/20 pt-2.5 text-[0.68rem] tracking-[0.18em] text-neutral/75 uppercase">
              <span>{project.formattedDate}</span>
              <span>{project.gallery.length} FOTOS</span>
            </div>
          </div>
        </div>
      </button>

      {/* Subtítulo editorial permanente debajo de la fotografía (estilo Saint Laurent / Obys) */}
      <div className="mt-3.5 flex items-baseline justify-between gap-4 border-b border-border-light pb-3.5">
        <div className="min-w-0">
          <h2 className="truncate font-heading text-lg font-medium tracking-tight text-text-heading transition-colors duration-300 group-hover:text-dark md:text-xl">
            <button
              type="button"
              onClick={() => onSelect(project)}
              className="text-left focus:outline-none"
            >
              {project.title}
            </button>
          </h2>
          {project.client && (
            <p className="mt-0.5 truncate text-xs tracking-[0.14em] text-text-muted uppercase font-body">
              {project.client}
            </p>
          )}
        </div>
        {project.monthYear && (
          <time
            dateTime={project.monthYear}
            className="shrink-0 text-[0.7rem] font-medium tracking-[0.18em] text-text-muted uppercase font-body"
          >
            {project.monthYear}
          </time>
        )}
      </div>
    </article>
  );
}
