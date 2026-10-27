"use client";

/* ============================================================
   OOPSY — Confidential B2B Casting Package View
   (components/casting/CastingPackageClient.tsx)

   Cumplimiento Ley N° 21.719 y Seguridad de Assets:
   - Banner legal permanente en encabezado y pie de página:
     "Material confidencial exclusivo para evaluación de casting. Prohibida su
      descarga, difusión o almacenamiento no autorizado (Ley N° 21.719)"
   - Gate de autenticación por PIN de 4 dígitos validado en el servidor.
   - Vista de enlace caducado (`expires_at` vencido) y token inválido.
   - Ficha técnica completa por talento: Medidas anatómicas (`bust`, `waist`,
     `hips`, `shoes`, `height`), galería de Polaroids/Digitals firmadas con
     expiración corta + marca de agua, Book editorial y Video de Pasarela.
   ============================================================ */

import { useState, useTransition } from "react";
import Link from "next/link";
import type { CastingPackageResolution } from "@/types/casting";
import type { FullTalentCastingProfile, TalentMediaAsset } from "@/types/talent";
import ImageShield from "@/components/ui/ImageShield";
import { verifyCastingPinAction } from "@/app/casting/[token]/actions";

export const LEGAL_CASTING_BANNER_TEXT =
  "Material confidencial exclusivo para evaluación de casting. Prohibida su descarga, difusión o almacenamiento no autorizado (Ley N° 21.719)";

interface CastingPackageClientProps {
  initialResolution: CastingPackageResolution;
}

type TalentMediaTab = "polaroids" | "book" | "runway";

function formatExpirationDate(isoString: string): string {
  const parsed = new Date(isoString);
  if (Number.isNaN(parsed.getTime())) return isoString;
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

export default function CastingPackageClient({
  initialResolution,
}: CastingPackageClientProps) {
  const [resolution, setResolution] =
    useState<CastingPackageResolution>(initialResolution);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState<string | undefined>(
    initialResolution.status === "requires_pin"
      ? initialResolution.pinError
      : undefined
  );
  const [isPending, startTransition] = useTransition();

  // Estado para inspección detallada de talento / lightbox confidencial
  const [activeMediaTabByTalent, setActiveMediaTabByTalent] = useState<
    Record<string, TalentMediaTab>
  >({});
  const [inspectedAsset, setInspectedAsset] = useState<{
    talent: FullTalentCastingProfile;
    asset: TalentMediaAsset;
    isPolaroid: boolean;
  } | null>(null);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (resolution.status !== "requires_pin") return;

    const cleanPin = pinInput.replace(/\D/g, "").slice(0, 4);
    if (cleanPin.length !== 4) {
      setPinError("Debes ingresar un código PIN válido de 4 dígitos.");
      return;
    }

    setPinError(undefined);
    startTransition(async () => {
      const updated = await verifyCastingPinAction(resolution.token, cleanPin);
      setResolution(updated);
      if (updated.status === "requires_pin" && updated.pinError) {
        setPinError(updated.pinError);
      }
    });
  };

  const getActiveTab = (talentId: string): TalentMediaTab =>
    activeMediaTabByTalent[talentId] || "polaroids";

  const setActiveTab = (talentId: string, tab: TalentMediaTab) => {
    setActiveMediaTabByTalent((prev) => ({ ...prev, [talentId]: tab }));
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="min-h-screen bg-dark-deep text-neutral select-none"
    >
      {/* ── BANNER LEGAL OBLIGATORIO SUPERIOR (Ley N° 21.719) ── */}
      <div
        role="region"
        aria-label="Advertencia legal de confidencialidad"
        className="sticky top-14 z-40 border-y border-secondary/30 bg-dark px-4 py-2.5 text-center shadow-md md:top-16"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2.5 text-[0.68rem] font-medium tracking-[0.12em] text-neutral/95 sm:text-xs">
          <span
            aria-hidden="true"
            className="inline-block h-2 w-2 shrink-0 rounded-full bg-secondary animate-pulse"
          />
          <p>{LEGAL_CASTING_BANNER_TEXT}</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:px-8 md:py-16 lg:px-12">
        {/* ── CASO 1: TOKEN INEXISTENTE O REVOCADO ── */}
        {resolution.status === "not_found" && (
          <div className="mx-auto my-12 max-w-xl border border-neutral/15 bg-dark p-8 text-center sm:p-12">
            <span className="inline-block border border-secondary/40 bg-secondary/10 px-3 py-1 text-[0.65rem] font-semibold tracking-[0.24em] text-secondary uppercase">
              ACCESO RESTRINGIDO · 404
            </span>
            <h1 className="mt-4 font-heading text-3xl font-normal text-neutral sm:text-4xl">
              Package de Casting no encontrado
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral/70">
              El enlace criptográfico{" "}
              <code className="rounded bg-neutral/10 px-1.5 py-0.5 text-xs text-primary">
                {resolution.token || "desconocido"}
              </code>{" "}
              no existe o ha sido revocado por el departamento de Booking de
              Oopsy.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Link
                href="/talentos"
                className="border border-neutral/25 px-6 py-3 text-xs font-medium tracking-[0.2em] text-neutral uppercase transition-colors hover:border-primary hover:text-primary"
              >
                Ver Book Público
              </Link>
              <Link
                href="/#contacto"
                className="bg-primary px-6 py-3 text-xs font-semibold tracking-[0.2em] text-dark uppercase transition-colors hover:bg-primary-dark"
              >
                Contactar Agencia
              </Link>
            </div>
          </div>
        )}

        {/* ── CASO 2: ENLACE DE CASTING CADUCADO (`expires_at` vencido) ── */}
        {resolution.status === "expired" && (
          <div
            data-testid="casting-expired-view"
            className="mx-auto my-12 max-w-2xl border border-secondary/35 bg-dark p-8 sm:p-12"
          >
            <div className="flex items-center justify-between border-b border-neutral/10 pb-4">
              <span className="inline-flex items-center gap-2 text-[0.68rem] font-semibold tracking-[0.24em] text-secondary uppercase">
                <span className="h-2 w-2 rounded-full bg-secondary" />
                ENLACE CADUCADO · LEY N° 21.719
              </span>
              <span className="text-xs tracking-[0.18em] text-neutral/45 uppercase">
                TOKEN: {resolution.token}
              </span>
            </div>

            <h1 className="mt-6 font-heading text-3xl font-normal text-neutral sm:text-4xl">
              La vigencia de este Package de Casting ha expirado
            </h1>

            <p className="mt-3 text-sm leading-relaxed text-neutral/75">
              Por políticas de seguridad y minimización de exposición de datos
              personales de nuestros talentos, el acceso a las fichas técnicas y
              Polaroids para{" "}
              <strong className="font-medium text-neutral">
                {resolution.clientName}
              </strong>{" "}
              finalizó automáticamente el{" "}
              <span className="text-secondary">
                {formatExpirationDate(resolution.expiresAt)}
              </span>
              .
            </p>

            <div className="mt-6 border border-neutral/10 bg-dark-deep/60 p-4 text-xs text-neutral/60">
              Las URLs firmadas de Cloudinary asociadas a esta sesión han sido
              invalidadas y ya no pueden ser resueltas por el CDN.
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/#contacto"
                className="bg-primary px-6 py-3.5 text-xs font-semibold tracking-[0.2em] text-dark uppercase transition-colors hover:bg-primary-dark"
              >
                Solicitar Renovación de Token
              </Link>
              <Link
                href="/talentos"
                className="border border-neutral/25 px-6 py-3.5 text-xs font-medium tracking-[0.2em] text-neutral uppercase transition-colors hover:border-neutral"
              >
                Ir al Escaparate Público
              </Link>
            </div>
          </div>
        )}

        {/* ── CASO 3: VERIFICACIÓN DE PIN DE 4 DÍGITOS REQUERIDA ── */}
        {resolution.status === "requires_pin" && (
          <div
            data-testid="casting-pin-gate"
            className="mx-auto my-10 max-w-lg border border-neutral/15 bg-dark p-7 shadow-2xl sm:p-10"
          >
            <div className="flex items-center justify-between border-b border-neutral/10 pb-4 text-[0.65rem] tracking-[0.22em] text-neutral/55 uppercase">
              <span>VERIFICACIÓN DE SEGURIDAD B2B</span>
              <span className="text-primary">PIN 4 DÍGITOS</span>
            </div>

            <p className="mt-5 text-xs tracking-[0.2em] text-primary uppercase">
              {resolution.clientName}
            </p>
            <h1 className="mt-1.5 font-heading text-3xl font-normal text-neutral">
              Package Protegido con PIN
            </h1>
            <p className="mt-2.5 text-sm leading-relaxed text-neutral/70">
              Este paquete contiene fichas anatómicas y Polaroids confidenciales
              de{" "}
              <strong className="text-neutral">
                {resolution.totalTalentsCount} talentos seleccionados
              </strong>
              . Ingresa el código PIN de 4 dígitos proporcionado por tu Booker.
            </p>

            <form onSubmit={handlePinSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="casting-pin-input"
                  className="block text-[0.68rem] font-semibold tracking-[0.22em] text-neutral/60 uppercase"
                >
                  Código PIN de Acceso (4 dígitos)
                </label>
                <input
                  id="casting-pin-input"
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]{4}"
                  maxLength={4}
                  autoComplete="one-time-code"
                  placeholder="••••"
                  value={pinInput}
                  onChange={(e) =>
                    setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))
                  }
                  disabled={isPending}
                  className="mt-2 w-full border border-neutral/25 bg-dark-deep px-4 py-3.5 text-center font-heading text-2xl tracking-[0.6em] text-neutral placeholder:text-neutral/25 focus:border-primary focus:outline-none"
                />
              </div>

              {pinError && (
                <p
                  role="alert"
                  className="border border-secondary/40 bg-secondary/10 px-3.5 py-2.5 text-xs text-secondary"
                >
                  {pinError}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending || pinInput.length !== 4}
                className="w-full bg-primary px-6 py-3.5 text-xs font-semibold tracking-[0.22em] text-dark uppercase transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isPending
                  ? "Verificando y Firmando Polaroids..."
                  : "Desbloquear Package Confidencial"}
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between border-t border-neutral/10 pt-4 text-[0.65rem] tracking-[0.16em] text-neutral/45 uppercase">
              <span>TOKEN: {resolution.token}</span>
              <span>VENCE: {formatExpirationDate(resolution.expiresAt)}</span>
            </div>
          </div>
        )}

        {/* ── CASO 4: PACKAGE AUTORIZADO Y VIGENTE ── */}
        {resolution.status === "authorized" && (
          <div>
            {/* Encabezado Ejecutivo del Package B2B */}
            <header className="border-b border-neutral/15 pb-8 md:pb-12">
              <div className="flex flex-wrap items-center justify-between gap-3 text-[0.68rem] tracking-[0.22em] uppercase">
                <div className="inline-flex items-center gap-2 border border-primary/35 bg-primary/10 px-3 py-1 text-primary">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span>CASTING PACKAGE B2B VERIFICADO</span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-neutral/60">
                  <span>TOKEN: {resolution.token}</span>
                  <span className="text-neutral/25">|</span>
                  <span>
                    EXPIRA: {formatExpirationDate(resolution.expiresAt)}
                  </span>
                  <span className="text-neutral/25">|</span>
                  <span className="text-accent-light">
                    SIGNED URL TTL: {resolution.signedUrlsTtlMinutes} MIN
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
                <div>
                  <p className="text-xs font-medium tracking-[0.24em] text-neutral/55 uppercase">
                    PREPARADO EXCLUSIVAMENTE PARA
                  </p>
                  <h1 className="mt-2 font-heading text-3xl font-normal leading-tight text-neutral sm:text-5xl">
                    {resolution.clientName}
                  </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[0.68rem] tracking-[0.18em] uppercase">
                  <span className="border border-neutral/20 bg-dark px-3.5 py-2 text-neutral/80">
                    {resolution.talents.length} TALENTOS EN SELECCIÓN
                  </span>
                  <span className="border border-neutral/20 bg-dark px-3.5 py-2 text-neutral/80">
                    EXIF STRIPPED (fl_strip_profile)
                  </span>
                  <span className="border border-neutral/20 bg-dark px-3.5 py-2 text-primary">
                    WATERMARK DINÁMICO ACTIVO
                  </span>
                </div>
              </div>

              {resolution.castingNote && (
                <p className="mt-5 max-w-3xl text-sm leading-relaxed text-neutral/75">
                  {resolution.castingNote}
                </p>
              )}
            </header>

            {/* Listado de Fichas Técnicas de Talentos del Package */}
            <div className="mt-12 space-y-16">
              {resolution.talents.map((talent, idx) => {
                const activeTab = getActiveTab(talent.id);

                return (
                  <article
                    key={talent.id}
                    data-talent-casting-card={talent.id}
                    className="border border-neutral/15 bg-dark/80 p-5 sm:p-8 lg:p-10"
                  >
                    {/* Cabecera de la Modelo + Tabla de Medidas Anatómicas */}
                    <div className="flex flex-col justify-between gap-6 border-b border-neutral/10 pb-7 lg:flex-row lg:items-end">
                      <div>
                        <div className="flex items-center gap-3 text-xs tracking-[0.22em] text-primary uppercase">
                          <span>
                            OPCIÓN {String(idx + 1).padStart(2, "0")}
                          </span>
                          <span className="text-neutral/25">/</span>
                          <span>{talent.id}</span>
                          <span className="text-neutral/25">/</span>
                          <span className="text-neutral/70">
                            {talent.category}
                          </span>
                        </div>
                        <h2 className="mt-2 font-heading text-3xl font-normal text-neutral sm:text-4xl">
                          {talent.name}
                        </h2>
                      </div>

                      {/* Ficha Técnica de Medidas Anatómicas (condicionada a show_measurements) */}
                      {resolution.showMeasurements && talent.measurements ? (
                        <dl
                          aria-label={`Medidas anatómicas de ${talent.name}`}
                          className="grid grid-cols-2 gap-px border border-neutral/15 bg-neutral/15 sm:grid-cols-5"
                        >
                          {[
                            {
                              label: "Estatura",
                              value: talent.measurements.height,
                            },
                            {
                              label: "Busto",
                              value: talent.measurements.bust,
                            },
                            {
                              label: "Cintura",
                              value: talent.measurements.waist,
                            },
                            {
                              label: "Cadera",
                              value: talent.measurements.hips,
                            },
                            {
                              label: "Calzado",
                              value: talent.measurements.shoes,
                            },
                          ].map((metric) => (
                            <div
                              key={metric.label}
                              className="bg-dark-deep px-4 py-2.5 text-center"
                            >
                              <dt className="text-[0.62rem] tracking-[0.2em] text-neutral/50 uppercase">
                                {metric.label}
                              </dt>
                              <dd className="mt-0.5 font-body text-sm font-semibold text-neutral">
                                {metric.value}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <div className="border border-neutral/15 bg-dark-deep px-4 py-2.5 text-xs tracking-[0.16em] text-neutral/60 uppercase">
                          Estatura: {talent.height} · Medidas anatómicas
                          ocultas en este package
                        </div>
                      )}
                    </div>

                    {/* Pestañas de Material Confidencial: Polaroids Firmadas | Book Editorial | Video de Pasarela */}
                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                      <div
                        role="tablist"
                        aria-label={`Material de evaluación de ${talent.name}`}
                        className="flex flex-wrap gap-2"
                      >
                        <button
                          type="button"
                          role="tab"
                          aria-selected={activeTab === "polaroids"}
                          onClick={() => setActiveTab(talent.id, "polaroids")}
                          className={`px-4 py-2 text-xs font-medium tracking-[0.18em] uppercase transition-colors ${
                            activeTab === "polaroids"
                              ? "bg-primary text-dark"
                              : "border border-neutral/20 bg-dark-deep text-neutral/75 hover:border-neutral/50"
                          }`}
                        >
                          Polaroids / Digitals ({talent.polaroidsGallery.length})
                        </button>

                        <button
                          type="button"
                          role="tab"
                          aria-selected={activeTab === "book"}
                          onClick={() => setActiveTab(talent.id, "book")}
                          className={`px-4 py-2 text-xs font-medium tracking-[0.18em] uppercase transition-colors ${
                            activeTab === "book"
                              ? "bg-primary text-dark"
                              : "border border-neutral/20 bg-dark-deep text-neutral/75 hover:border-neutral/50"
                          }`}
                        >
                          Book Editorial ({talent.bookGallery.length})
                        </button>

                        {talent.runwayVideoUrl && (
                          <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "runway"}
                            onClick={() => setActiveTab(talent.id, "runway")}
                            className={`px-4 py-2 text-xs font-medium tracking-[0.18em] uppercase transition-colors ${
                              activeTab === "runway"
                                ? "bg-primary text-dark"
                                : "border border-neutral/20 bg-dark-deep text-neutral/75 hover:border-neutral/50"
                            }`}
                          >
                            Video de Pasarela ▶
                          </button>
                        )}
                      </div>

                      <span className="text-[0.65rem] tracking-[0.18em] text-neutral/45 uppercase">
                        {activeTab === "polaroids"
                          ? "CLOUDINARY SIGNED URL · WATERMARK CONFIDENCIAL"
                          : activeTab === "book"
                            ? "FOTOGRAFÍA EDITORIAL · SIN METADATOS EXIF"
                            : "REGISTRO DE MOVIMIENTO Y PASARELA"}
                      </span>
                    </div>

                    {/* Panel 1: Galería de Polaroids / Digitals con URLs Firmadas y Marca de Agua */}
                    {activeTab === "polaroids" && (
                      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {talent.polaroidsGallery.map((pola, pIdx) => (
                          <div
                            key={pola.id}
                            className="group flex flex-col border border-neutral/10 bg-dark-deep p-3"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setInspectedAsset({
                                  talent,
                                  asset: pola,
                                  isPolaroid: true,
                                })
                              }
                              className="relative aspect-[3/4] w-full overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <ImageShield
                                src={pola.src}
                                alt={pola.alt}
                                fill
                                priority={idx === 0 && pIdx === 0}
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                blurDataURL={pola.blurDataURL}
                                watermarkText="OOPSY CASTING CONFIDENCIAL"
                                containerClassName="h-full w-full"
                                imageClassName="object-cover transition-transform duration-500 group-hover:scale-103"
                              />
                            </button>

                            <div className="mt-3 flex items-center justify-between gap-2 text-[0.68rem] tracking-[0.14em] text-neutral/70 uppercase">
                              <span className="truncate">
                                {pola.caption || `Polaroid 0${pIdx + 1}`}
                              </span>
                              <span className="shrink-0 text-[0.6rem] text-primary">
                                FIRMADA
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Panel 2: Galería de Book Editorial */}
                    {activeTab === "book" && (
                      <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {talent.bookGallery.map((bookImg) => (
                          <div
                            key={bookImg.id}
                            className="group flex flex-col border border-neutral/10 bg-dark-deep p-3"
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setInspectedAsset({
                                  talent,
                                  asset: bookImg,
                                  isPolaroid: false,
                                })
                              }
                              className="relative aspect-[3/4] w-full overflow-hidden text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            >
                              <ImageShield
                                src={bookImg.src}
                                alt={bookImg.alt}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                blurDataURL={bookImg.blurDataURL}
                                containerClassName="h-full w-full"
                                imageClassName="object-cover transition-transform duration-500 group-hover:scale-103"
                              />
                            </button>
                            <div className="mt-3 flex items-center justify-between gap-2 text-[0.68rem] tracking-[0.14em] text-neutral/70 uppercase">
                              <span className="truncate">
                                {bookImg.caption || "Book Editorial"}
                              </span>
                              <span className="shrink-0 text-[0.6rem] text-neutral/45">
                                BOOK
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Panel 3: Video de Pasarela (Runway Walk) */}
                    {activeTab === "runway" && talent.runwayVideoUrl && (
                      <div className="mt-6 border border-neutral/15 bg-dark-deep p-4 sm:p-6">
                        <div className="mx-auto max-w-3xl">
                          <video
                            src={talent.runwayVideoUrl}
                            controls
                            controlsList="nodownload noplaybackrate"
                            disablePictureInPicture
                            playsInline
                            preload="metadata"
                            onContextMenu={(e) => e.preventDefault()}
                            className="aspect-video w-full bg-black object-contain"
                          >
                            Tu navegador no soporta reproducción de video HTML5.
                          </video>
                          <p className="mt-3 text-xs tracking-[0.16em] text-neutral/60 uppercase">
                            Registro confidencial de pasarela y actitud en
                            cámara — {talent.name}
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL DE INSPECCIÓN DE POLAROID PROTEGIDA ── */}
      {inspectedAsset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Inspección de fotografía de ${inspectedAsset.talent.name}`}
          onContextMenu={(e) => e.preventDefault()}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-dark-deep/95 p-4 backdrop-blur-xl select-none sm:p-8"
        >
          <div className="mb-4 flex w-full max-w-4xl items-center justify-between border-b border-neutral/15 pb-3">
            <div>
              <p className="text-[0.65rem] tracking-[0.22em] text-primary uppercase">
                {inspectedAsset.isPolaroid
                  ? "POLAROID CONFIDENCIAL FIRMADA · LEY N° 21.719"
                  : "BOOK EDITORIAL"}
              </p>
              <h3 className="font-heading text-xl text-neutral">
                {inspectedAsset.talent.name} —{" "}
                <span className="text-sm font-body text-neutral/70">
                  {inspectedAsset.asset.caption}
                </span>
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setInspectedAsset(null)}
              className="border border-neutral/25 px-4 py-1.5 text-xs tracking-[0.2em] text-neutral uppercase transition-colors hover:border-primary hover:bg-primary hover:text-dark"
            >
              Cerrar ✕
            </button>
          </div>

          <div className="relative h-[72dvh] w-full max-w-4xl">
            <ImageShield
              src={inspectedAsset.asset.src}
              alt={inspectedAsset.asset.alt}
              fill
              priority
              sizes="90vw"
              blurDataURL={inspectedAsset.asset.blurDataURL}
              watermarkText={
                inspectedAsset.isPolaroid
                  ? "OOPSY CASTING CONFIDENCIAL"
                  : undefined
              }
              containerClassName="h-full w-full"
              imageClassName="object-contain"
            />
          </div>
        </div>
      )}

      {/* ── BANNER LEGAL OBLIGATORIO EN EL PIE (Ley N° 21.719) ── */}
      <footer className="mt-16 border-t border-neutral/15 bg-dark px-4 py-8 text-center">
        <div className="mx-auto max-w-4xl space-y-2">
          <p className="text-xs font-semibold tracking-[0.14em] text-secondary uppercase">
            {LEGAL_CASTING_BANNER_TEXT}
          </p>
          <p className="text-[0.7rem] text-neutral/50">
            Todas las fotografías Polaroids/Digitals son servidas mediante
            enlaces criptográficos efímeros con marca de agua trazable y
            eliminación de metadatos EXIF.
          </p>
        </div>
      </footer>
    </div>
  );
}
