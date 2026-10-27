"use client";

/* ============================================================
   OOPSY — Public Editorial Talent Grid & Book Modal
   (components/talents/TalentGrid.tsx)

   Cumplimiento estricto Ley N° 21.719:
   - Recibe exclusivamente `PublicTalentProfile[]` desde el Server Component.
   - Muestra únicamente: Nombre, Categoría/División, Estatura general (`height`),
     Créditos editoriales y Fotografías artísticas del Book.
   - Protege todas las imágenes con `<ImageShield />` (bloqueo de clic derecho,
     arrastre deshabilitado y escudo transparente superpuesto).
   ============================================================ */

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import type {
  PublicTalentProfile,
  TalentFilterCategory,
} from "@/types/talent";
import type { EditorialAspectRatio } from "@/types/portfolio";
import ImageShield from "@/components/ui/ImageShield";
import { useReveal } from "@/app/hooks/useReveal";
import { trackEvent } from "@/app/lib/gtag";

export const TALENT_FILTER_TABS: readonly TalentFilterCategory[] = [
  "Todos",
  "Editorial & Couture",
  "Runway / Pasarela",
  "Commercial & Rostro",
  "New Faces",
];

const ASPECT_RATIO_CLASSES: Record<EditorialAspectRatio, string> = {
  "3:4": "aspect-[3/4]",
  "4:5": "aspect-[4/5]",
  "16:10": "aspect-[16/10]",
  "1:1": "aspect-square",
};

function getEditorialOffsetClass(index: number): string {
  const mod = index % 3;
  if (mod === 1) return "lg:mt-12";
  if (mod === 2) return "lg:mt-6";
  return "";
}

interface TalentGridProps {
  talents: PublicTalentProfile[];
}

export default function TalentGrid({ talents }: TalentGridProps) {
  const [activeCategory, setActiveCategory] =
    useState<TalentFilterCategory>("Todos");
  const [selectedTalent, setSelectedTalent] =
    useState<PublicTalentProfile | null>(null);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);

  const { ref: headerRef, isVisible: isHeaderVisible } = useReveal(0.1);

  const filteredTalents = useMemo(() => {
    if (activeCategory === "Todos") return talents;
    return talents.filter((t) => t.category === activeCategory);
  }, [talents, activeCategory]);

  const categoryCounts = useMemo(() => {
    const counts: Record<TalentFilterCategory, number> = {
      Todos: talents.length,
      "Editorial & Couture": 0,
      "Runway / Pasarela": 0,
      "Commercial & Rostro": 0,
      "New Faces": 0,
    };
    for (const t of talents) {
      if (counts[t.category] !== undefined) {
        counts[t.category] += 1;
      }
    }
    return counts;
  }, [talents]);

  const handleSelectTalent = (talent: PublicTalentProfile) => {
    setSelectedTalent(talent);
    setActiveSlideIndex(0);
    trackEvent("open_talent_book", {
      event_category: "Talents",
      event_label: `${talent.id} - ${talent.name}`,
    });
  };

  const handleCloseModal = useCallback(() => {
    setSelectedTalent(null);
    setActiveSlideIndex(0);
  }, []);

  const totalBookImages = selectedTalent?.bookGallery.length ?? 0;

  const goNextSlide = useCallback(() => {
    if (!totalBookImages) return;
    setActiveSlideIndex((prev) => (prev + 1) % totalBookImages);
  }, [totalBookImages]);

  const goPrevSlide = useCallback(() => {
    if (!totalBookImages) return;
    setActiveSlideIndex(
      (prev) => (prev - 1 + totalBookImages) % totalBookImages
    );
  }, [totalBookImages]);

  useEffect(() => {
    if (!selectedTalent) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleCloseModal();
      else if (e.key === "ArrowRight") goNextSlide();
      else if (e.key === "ArrowLeft") goPrevSlide();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selectedTalent, handleCloseModal, goNextSlide, goPrevSlide]);

  return (
    <section
      id="talentos"
      aria-label="Representación de Talentos y Modelos Oopsy"
      onContextMenu={(e) => e.preventDefault()}
      className="relative overflow-hidden bg-surface px-4 py-14 select-none sm:px-6 sm:py-20 md:px-8 md:py-28 lg:px-12 lg:py-36"
    >
      {/* Sutil textura de marca */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: "url('/images/patterns/stripes-light.png')",
          backgroundSize: "320px",
          backgroundRepeat: "repeat",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Cabecera Editorial */}
        <div
          ref={headerRef}
          className={`reveal border-b border-border pb-8 sm:pb-10 md:pb-14 ${
            isHeaderVisible ? "visible" : ""
          }`}
        >
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.22em] text-text-muted uppercase font-body sm:gap-2.5 sm:text-[0.7rem]">
                <span className="h-1.5 w-1.5 rounded-full bg-dark" />
                <span>MODEL MANAGEMENT & ROSTER</span>
                <span className="text-border">/</span>
                <span>BOOK PÚBLICO</span>
              </div>

              <h1 className="mt-3 font-heading text-[2.35rem] font-normal leading-[1.05] tracking-tight text-text-heading sm:mt-4 sm:text-5xl md:text-6xl lg:text-[4.25rem]">
                Talentos &{" "}
                <span className="italic font-light text-dark/75">Books</span>
              </h1>
            </div>

            <div className="max-w-md space-y-2">
              <p className="text-sm font-light leading-relaxed text-text-muted font-body md:text-base">
                Representación editorial de modelos, rostros de campaña y
                talentos de pasarela. Selección curada bajo estándares de alta
                costura.
              </p>
              <p className="text-[0.7rem] tracking-[0.14em] text-dark/60 uppercase font-body">
                Protección de datos Ley N° 21.719 · Fichas técnicas y Polaroids
                exclusivas vía Package B2B.
              </p>
            </div>
          </div>

          {/* Filtros de División */}
          <div
            role="tablist"
            aria-label="Filtrar talentos por división"
            className="-mx-4 mt-7 flex snap-x snap-mandatory items-center gap-2 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mt-10 sm:flex-wrap sm:gap-3 sm:overflow-visible sm:px-0 sm:pb-0 md:mt-12"
          >
            {TALENT_FILTER_TABS.map((category) => {
              const isActive = activeCategory === category;
              const count = categoryCounts[category];

              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => {
                    setActiveCategory(category);
                    trackEvent("filter_talents", {
                      event_category: "Talents",
                      event_label: category,
                    });
                  }}
                  className={`group relative inline-flex shrink-0 snap-start items-center gap-2 border px-4 py-2.5 text-[0.72rem] tracking-[0.16em] uppercase transition-all duration-300 font-body sm:px-5 sm:py-2.5 sm:text-xs sm:tracking-[0.18em] ${
                    isActive
                      ? "border-dark bg-dark text-neutral shadow-sm"
                      : "border-border bg-surface/90 text-text-body active:scale-[0.98] hover:border-dark/40 hover:text-dark"
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

        {/* Grilla Editorial de Talentos */}
        {filteredTalents.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-y-12 sm:mt-14 md:grid-cols-2 md:gap-x-8 md:gap-y-16 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-20">
            {filteredTalents.map((talent, index) => {
              const aspectClass =
                ASPECT_RATIO_CLASSES[talent.aspectRatio] || "aspect-[3/4]";
              const offsetClass = getEditorialOffsetClass(index);
              const indexLabel = String(index + 1).padStart(2, "0");

              return (
                <article
                  key={talent.id}
                  data-talent-id={talent.id}
                  className={`group relative flex flex-col ${offsetClass}`}
                >
                  {/* Meta superior */}
                  <div className="mb-2.5 flex items-center justify-between text-[0.68rem] tracking-[0.22em] text-text-muted uppercase font-body">
                    <span className="font-medium text-dark/45">
                      {indexLabel} <span className="mx-1 text-border">/</span>{" "}
                      {talent.id}
                    </span>
                    <span className="truncate pl-3 text-dark/65">
                      {talent.category}
                    </span>
                  </div>

                  {/* Tarjeta con Escudo Anti-Clic Derecho (<ImageShield />) */}
                  <button
                    type="button"
                    onClick={() => handleSelectTalent(talent)}
                    onContextMenu={(e) => e.preventDefault()}
                    aria-label={`Ver Book Editorial de ${talent.name} (${talent.height})`}
                    className={`relative w-full overflow-hidden bg-neutral-dark text-left select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-dark focus-visible:ring-offset-4 ${aspectClass}`}
                  >
                    <ImageShield
                      src={talent.coverImage}
                      alt={`${talent.name} — Book Editorial Oopsy`}
                      fill
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      blurDataURL={talent.blurDataURL}
                      containerClassName="h-full w-full"
                      imageClassName="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                    />

                    {/* Badge móvil */}
                    <div
                      className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between bg-gradient-to-t from-dark-deep/80 via-dark-deep/30 to-transparent px-4 pt-10 pb-3.5 text-neutral md:hidden"
                      aria-hidden="true"
                    >
                      <span className="inline-flex items-center gap-1.5 border border-neutral/25 bg-dark-deep/60 px-2.5 py-1 text-[0.62rem] font-medium tracking-[0.2em] uppercase backdrop-blur-md">
                        ESTATURA {talent.height}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[0.65rem] font-medium tracking-[0.18em] text-primary uppercase">
                        <span>Ver Book</span>
                        <span>↗</span>
                      </span>
                    </div>

                    {/* Hover Overlay Desktop */}
                    <div
                      className="pointer-events-none absolute inset-0 z-20 hidden flex-col justify-between bg-gradient-to-t from-dark-deep/85 via-dark-deep/25 to-transparent p-6 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100 md:flex md:p-7"
                      aria-hidden="true"
                    >
                      <div className="flex items-center justify-between">
                        <span className="inline-block border border-neutral/30 bg-dark-deep/45 px-2.5 py-1 text-[0.62rem] font-medium tracking-[0.22em] text-neutral uppercase backdrop-blur-md">
                          ESTATURA · {talent.height}
                        </span>
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

                      <div className="translate-y-3 transition-transform duration-500 ease-out group-hover:translate-y-0">
                        <p className="text-[0.68rem] font-medium tracking-[0.24em] text-primary uppercase font-body">
                          {talent.category}
                        </p>
                        <h3 className="mt-1.5 font-heading text-2xl font-normal leading-[1.12] tracking-tight text-neutral md:text-[1.65rem]">
                          {talent.name}
                        </h3>
                        <div className="mt-3 flex items-center justify-between border-t border-neutral/20 pt-2.5 text-[0.68rem] tracking-[0.18em] text-neutral/75 uppercase">
                          <span>BOOK ARTÍSTICO</span>
                          <span>{talent.bookGallery.length} TOMAS</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Pie permanente de tarjeta */}
                  <div className="mt-3.5 flex items-baseline justify-between gap-4 border-b border-border-light pb-3.5">
                    <div className="min-w-0">
                      <h2 className="truncate font-heading text-lg font-medium tracking-tight text-text-heading transition-colors duration-300 group-hover:text-dark md:text-xl">
                        <button
                          type="button"
                          onClick={() => handleSelectTalent(talent)}
                          className="text-left focus:outline-none"
                        >
                          {talent.name}
                        </button>
                      </h2>
                      {talent.credits.recentCampaigns && (
                        <p className="mt-0.5 truncate text-xs tracking-[0.12em] text-text-muted uppercase font-body">
                          {talent.credits.recentCampaigns}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 text-[0.72rem] font-medium tracking-[0.18em] text-dark/75 uppercase font-body">
                      {talent.height}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="my-20 border border-dashed border-border py-20 text-center">
            <p className="font-heading text-2xl text-text-heading">
              No hay talentos publicados en esta división.
            </p>
          </div>
        )}

        {/* Banner B2B para Directores de Casting y Marcas */}
        <div className="mt-20 flex flex-col items-start justify-between gap-6 border border-border bg-neutral/60 p-6 sm:p-8 md:flex-row md:items-center md:p-10">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.22em] text-dark/70 uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-secondary-dark" />
              CASTING PRIVADO B2B · CUMPLIMIENTO LEY N° 21.719
            </span>
            <h2 className="mt-2 font-heading text-2xl font-normal text-text-heading sm:text-3xl">
              ¿Eres director de casting, productor o marca?
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-muted font-body">
              Por normativa de privacidad y protección de datos biométricos/anatómicos,
              las medidas específicas, videos de pasarela y Polaroids al natural
              se comparten únicamente mediante un{" "}
              <strong className="font-medium text-dark">
                Package Confidencial con Token Criptográfico
              </strong>
              .
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/#contacto"
              className="inline-flex items-center gap-2.5 bg-dark px-6 py-3.5 text-xs font-medium tracking-[0.2em] text-neutral uppercase transition-colors hover:bg-primary hover:text-dark"
            >
              <span>Solicitar Package de Casting</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Lightbox de Book Público (Solo fotos artísticas, estatura general y créditos) */}
      {selectedTalent && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="talent-book-modal-title"
          onContextMenu={(e) => e.preventDefault()}
          className="fixed inset-0 z-[100] flex h-dvh flex-col overflow-y-auto bg-dark-deep/95 text-neutral backdrop-blur-xl animate-fade-in select-none lg:flex-row lg:overflow-hidden"
        >
          {/* Barra superior móvil */}
          <div className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-neutral/10 bg-dark-deep/90 px-4 py-3.5 backdrop-blur-md lg:hidden">
            <div className="flex items-center gap-2 text-xs tracking-[0.18em] uppercase">
              <span className="truncate max-w-[160px] font-medium text-neutral">
                {selectedTalent.name}
              </span>
              <span className="text-neutral/30">·</span>
              <span className="text-primary">
                {String(activeSlideIndex + 1).padStart(2, "0")} /{" "}
                {String(totalBookImages).padStart(2, "0")}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCloseModal}
              className="border border-neutral/25 px-3 py-1 text-[0.68rem] tracking-[0.2em] uppercase hover:border-primary hover:text-primary"
            >
              Cerrar ✕
            </button>
          </div>

          {/* Visor de Fotografía del Book con ImageShield */}
          <div className="relative flex shrink-0 flex-col items-center justify-center px-4 py-6 lg:flex-1 lg:px-12 lg:py-10">
            <div className="relative flex h-[50dvh] w-full max-w-4xl items-center justify-center sm:h-[60dvh] lg:h-[76dvh]">
              {selectedTalent.bookGallery.map((img, idx) => {
                const isCurrent = idx === activeSlideIndex;
                return (
                  <div
                    key={img.id}
                    className={`h-full w-full transition-opacity duration-200 ${
                      isCurrent
                        ? "relative z-10 opacity-100"
                        : "pointer-events-none absolute inset-0 opacity-0"
                    }`}
                  >
                    <ImageShield
                      src={img.src}
                      alt={img.alt}
                      fill
                      priority={isCurrent && idx === 0}
                      lowPriorityHidden={!isCurrent}
                      sizes="(max-width: 1024px) 95vw, 65vw"
                      blurDataURL={img.blurDataURL}
                      containerClassName="h-full w-full"
                      imageClassName="object-contain"
                    />
                  </div>
                );
              })}
            </div>

            {/* Controles del carrusel del Book */}
            <div className="mt-4 flex w-full max-w-4xl items-center justify-between border-t border-neutral/10 pt-3 text-xs text-neutral/75">
              <div className="flex items-center gap-3">
                <span className="font-medium tracking-[0.2em] text-primary uppercase">
                  {String(activeSlideIndex + 1).padStart(2, "0")} /{" "}
                  {String(totalBookImages).padStart(2, "0")}
                </span>
                {selectedTalent.bookGallery[activeSlideIndex]?.caption && (
                  <span className="truncate max-w-md text-neutral/80">
                    {selectedTalent.bookGallery[activeSlideIndex].caption}
                  </span>
                )}
              </div>

              {totalBookImages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goPrevSlide}
                    aria-label="Foto anterior del Book"
                    className="flex h-9 w-9 items-center justify-center border border-neutral/20 text-neutral transition-colors hover:border-primary hover:bg-primary hover:text-dark"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    onClick={goNextSlide}
                    aria-label="Foto siguiente del Book"
                    className="flex h-9 w-9 items-center justify-center border border-neutral/20 text-neutral transition-colors hover:border-primary hover:bg-primary hover:text-dark"
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Columna Lateral de Información Pública del Book */}
          <aside className="flex w-full flex-col justify-between border-t border-neutral/10 bg-dark/95 px-6 py-7 lg:h-full lg:w-[400px] lg:shrink-0 lg:overflow-y-auto lg:border-t-0 lg:border-l lg:px-9 lg:py-10">
            <div>
              <div className="hidden items-center justify-between border-b border-neutral/10 pb-5 lg:flex">
                <span className="text-[0.68rem] tracking-[0.24em] text-neutral/50 uppercase">
                  BOOK PÚBLICO · {selectedTalent.id}
                </span>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="border border-neutral/20 px-3 py-1 text-[0.68rem] tracking-[0.2em] uppercase transition-colors hover:border-primary hover:bg-primary hover:text-dark"
                >
                  ESC ✕
                </button>
              </div>

              <p className="mt-4 text-[0.7rem] tracking-[0.2em] text-primary uppercase lg:mt-6">
                {selectedTalent.category}
              </p>
              <h2
                id="talent-book-modal-title"
                className="mt-1.5 font-heading text-3xl font-normal text-neutral"
              >
                {selectedTalent.name}
              </h2>

              {/* Único dato físico público permitido: Estatura general */}
              <div className="mt-5 flex items-center justify-between border-y border-neutral/10 py-3.5 text-xs tracking-[0.18em] uppercase">
                <span className="text-neutral/55">Estatura General</span>
                <span className="font-semibold text-neutral">
                  {selectedTalent.height}
                </span>
              </div>

              {/* Créditos Editoriales */}
              <dl className="mt-5 space-y-3.5 text-sm">
                {selectedTalent.credits.photography && (
                  <div>
                    <dt className="text-[0.65rem] font-semibold tracking-[0.22em] text-neutral/45 uppercase">
                      Fotografía Book
                    </dt>
                    <dd className="mt-0.5 text-neutral/90">
                      {selectedTalent.credits.photography}
                    </dd>
                  </div>
                )}
                {selectedTalent.credits.styling && (
                  <div>
                    <dt className="text-[0.65rem] font-semibold tracking-[0.22em] text-neutral/45 uppercase">
                      Dirección de Arte & Styling
                    </dt>
                    <dd className="mt-0.5 text-neutral/90">
                      {selectedTalent.credits.styling}
                    </dd>
                  </div>
                )}
                {selectedTalent.credits.recentCampaigns && (
                  <div>
                    <dt className="text-[0.65rem] font-semibold tracking-[0.22em] text-neutral/45 uppercase">
                      Campañas / Editorial
                    </dt>
                    <dd className="mt-0.5 text-neutral/90">
                      {selectedTalent.credits.recentCampaigns}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Nota de Privacidad B2B */}
            <div className="mt-8 border border-neutral/15 bg-neutral/5 p-4 text-xs leading-relaxed text-neutral/70">
              <p className="font-semibold tracking-[0.16em] text-primary uppercase">
                Datos Protegidos (Ley N° 21.719)
              </p>
              <p className="mt-1">
                Las medidas anatómicas detalladas y Polaroids al natural no se
                publican en el escaparate abierto. Solicita un enlace de casting
                privado a nuestro equipo de Booking.
              </p>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}
