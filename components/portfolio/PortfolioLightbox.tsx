"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import type { PortfolioProject } from "@/types/portfolio";

interface PortfolioLightboxProps {
  project: PortfolioProject | null;
  onClose: () => void;
}

export default function PortfolioLightbox({
  project,
  onClose,
}: PortfolioLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  const totalImages = project?.gallery.length ?? 0;

  const goNext = useCallback(() => {
    if (!totalImages) return;
    setCurrentIndex((prev) => (prev + 1) % totalImages);
  }, [totalImages]);

  const goPrev = useCallback(() => {
    if (!totalImages) return;
    setCurrentIndex((prev) => (prev - 1 + totalImages) % totalImages);
  }, [totalImages]);

  // Navegación por teclado (Escape, ArrowLeft, ArrowRight) y bloqueo de scroll del body
  useEffect(() => {
    if (!project) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [project, onClose, goNext, goPrev]);

  if (!project) return null;

  const currentImage = project.gallery[currentIndex] || project.gallery[0];

  // Gestos táctiles (Swipe izquierda / derecha)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 48;

    if (distance > minSwipeDistance) {
      goNext();
    } else if (distance < -minSwipeDistance) {
      goPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-project-title"
      className="fixed inset-0 z-[100] flex flex-col bg-dark-deep/95 text-neutral backdrop-blur-xl animate-fade-in lg:flex-row"
    >
      {/* Top Bar Mobile / Floating Close Button */}
      <div className="flex items-center justify-between border-b border-neutral/10 px-5 py-4 lg:hidden">
        <div className="flex items-center gap-3 text-xs tracking-[0.2em] text-neutral/70 uppercase">
          <span>{project.id}</span>
          <span>—</span>
          <span>
            {String(currentIndex + 1).padStart(2, "0")} /{" "}
            {String(totalImages).padStart(2, "0")}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar galería"
          className="inline-flex items-center gap-2 border border-neutral/20 px-3.5 py-1.5 text-xs tracking-[0.2em] text-neutral uppercase transition-colors hover:border-primary hover:text-primary"
        >
          Cerrar ✕
        </button>
      </div>

      {/* Área Principal de Fotografía (Izquierda / Centro) */}
      <div
        className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-6 sm:px-10 lg:px-16 lg:py-12"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Contenedor de imagen activa con precarga de galería para cambio instantáneo */}
        <div className="relative flex h-full max-h-[68vh] w-full max-w-5xl items-center justify-center lg:max-h-[82vh]">
          {project.gallery.map((img, idx) => {
            const isActive = idx === currentIndex;
            return (
              <Image
                key={img.id}
                src={img.src}
                alt={img.alt}
                width={img.width}
                height={img.height}
                sizes="(max-width: 1024px) 95vw, 68vw"
                priority={isActive || idx === 0}
                loading="eager"
                unoptimized={img.src.includes("res.cloudinary.com")}
                placeholder="blur"
                blurDataURL={img.blurDataURL || project.blurDataURL}
                className={`max-h-[68vh] w-auto max-w-full object-contain transition-opacity duration-200 lg:max-h-[80vh] ${
                  isActive
                    ? "relative z-10 opacity-100"
                    : "pointer-events-none absolute inset-0 m-auto opacity-0"
                }`}
              />
            );
          })}
        </div>

        {/* Caption & Controles de Navegación Superpuestos */}
        <div className="mt-4 flex w-full max-w-5xl items-center justify-between gap-4 border-t border-neutral/10 pt-4 text-xs text-neutral/70">
          <div className="hidden sm:block">
            <span className="font-medium tracking-[0.2em] text-primary uppercase">
              {String(currentIndex + 1).padStart(2, "0")} /{" "}
              {String(totalImages).padStart(2, "0")}
            </span>
            {currentImage.caption && (
              <span className="ml-4 text-neutral/75 font-body">
                {currentImage.caption}
              </span>
            )}
          </div>

          {/* Botones Anterior / Siguiente */}
          {totalImages > 1 && (
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={goPrev}
                aria-label="Fotografía anterior"
                className="flex h-10 w-10 items-center justify-center border border-neutral/20 text-neutral transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-dark"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Fotografía siguiente"
                className="flex h-10 w-10 items-center justify-center border border-neutral/20 text-neutral transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-dark"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.75}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.25 4.5l7.5 7.5-7.5 7.5"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Ficha Técnica Editorial (Columna Derecha en Desktop / Inferior en Mobile) */}
      <aside className="flex w-full flex-col justify-between border-t border-neutral/10 bg-dark/90 px-6 py-6 sm:px-8 lg:w-[400px] lg: shrink-0 lg:border-t-0 lg:border-l lg:px-10 lg:py-10 xl:w-[440px]">
        <div>
          {/* Header Desktop con botón de cierre */}
          <div className="hidden items-center justify-between border-b border-neutral/10 pb-6 lg:flex">
            <span className="text-[0.68rem] font-medium tracking-[0.24em] text-neutral/50 uppercase">
              FICHA EDITORIAL · {project.id}
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar galería (Esc)"
              className="group inline-flex items-center gap-2 border border-neutral/20 px-3.5 py-1.5 text-[0.68rem] tracking-[0.22em] text-neutral uppercase transition-colors duration-300 hover:border-primary hover:bg-primary hover:text-dark"
            >
              <span>ESC</span>
              <span className="text-xs leading-none">✕</span>
            </button>
          </div>

          {/* Categoría & Fecha */}
          <div className="mt-2 flex items-center justify-between text-[0.7rem] tracking-[0.2em] text-primary uppercase lg:mt-7">
            <span>{project.category}</span>
            <time dateTime={project.monthYear} className="text-neutral/60">
              {project.monthYear}
            </time>
          </div>

          {/* Título del Proyecto & Cliente */}
          <h2
            id="lightbox-project-title"
            className="mt-2.5 font-heading text-2xl font-normal leading-[1.1] tracking-tight text-neutral sm:text-3xl lg:text-[2.1rem]"
          >
            {project.title}
          </h2>
          <p className="mt-2 text-xs font-medium tracking-[0.2em] text-neutral/65 uppercase">
            CLIENTE / MARCA —{" "}
            <span className="text-neutral">{project.client}</span>
          </p>

          {/* Créditos Editoriales (Fotografía y Dirección de Arte / Estilismo) */}
          <dl className="mt-6 space-y-4 border-y border-neutral/10 py-5 text-sm lg:mt-8 lg:space-y-5 lg:py-6">
            <div>
              <dt className="text-[0.65rem] font-semibold tracking-[0.22em] text-neutral/45 uppercase">
                Créditos — Fotografía
              </dt>
              <dd className="mt-1 font-body text-sm font-normal text-neutral/90">
                {project.credits.photography}
              </dd>
            </div>

            <div>
              <dt className="text-[0.65rem] font-semibold tracking-[0.22em] text-neutral/45 uppercase">
                Créditos — Dirección de Arte / Estilismo
              </dt>
              <dd className="mt-1 font-body text-sm font-normal text-neutral/90">
                {project.credits.artDirectionAndStyling}
              </dd>
            </div>
          </dl>
        </div>

        {/* Tira de miniaturas (Lazy loading) para saltar entre tomas del proyecto */}
        <div className="mt-6">
          <p className="mb-3 text-[0.65rem] tracking-[0.22em] text-neutral/45 uppercase">
            SECUENCIA COMPLETA ({totalImages})
          </p>
          <div className="grid grid-cols-4 gap-2.5">
            {project.gallery.map((img, idx) => {
              const isSelected = idx === currentIndex;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  aria-label={`Ver fotografía ${idx + 1} de ${totalImages}`}
                  aria-current={isSelected ? "true" : undefined}
                  className={`relative aspect-[3/4] overflow-hidden border transition-all duration-300 ${
                    isSelected
                      ? "border-primary opacity-100 ring-1 ring-primary"
                      : "border-transparent opacity-45 hover:opacity-80"
                  }`}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    sizes="96px"
                    loading="eager"
                    unoptimized={img.src.includes("res.cloudinary.com")}
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>

          <p className="mt-4 hidden text-[0.65rem] tracking-[0.18em] text-neutral/35 uppercase lg:block">
            USA LAS FLECHAS ← → O DESLIZA PARA NAVEGAR
          </p>
        </div>
      </aside>
    </div>
  );
}
