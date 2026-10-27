"use client";

/* ============================================================
   OOPSY — Anti-Extraction Image Shield (components/ui/ImageShield.tsx)

   Barrera de protección en interfaz (Defensa en Profundidad - Ley N° 21.719):
   - Bloquea el menú contextual secundario (`onContextMenu={(e) => e.preventDefault()}`).
   - Impide el arrastre directo hacia el escritorio o pestañas (`onDragStart`, `draggable={false}`).
   - Deshabilita selección de usuario y callouts táctiles en iOS/Android
     (`select-none`, `[-webkit-touch-callout:none]`).
   - Aplica `pointer-events-none` al elemento `<img>` real y superpone un
     escudo transparente (`z-10`) que intercepta intentos de guardado rápido.
   - Soporta capa de marca de agua visual opcional (`watermarkText`) como
     respaldo adicional al watermark dinámico de Cloudinary.
   ============================================================ */

import type { ReactNode, SyntheticEvent } from "react";
import Image from "next/image";

export interface ImageShieldProps {
  /** URL de la imagen optimizada (con `fl_strip_profile`) */
  src?: string;
  /** Texto alternativo accesible */
  alt?: string;
  /** Modo `fill` de `next/image` */
  fill?: boolean;
  /** Ancho intrínseco si no se usa `fill` */
  width?: number;
  /** Alto intrínseco si no se usa `fill` */
  height?: number;
  /** Atributo `sizes` responsivo */
  sizes?: string;
  /** Elevar prioridad para la imagen candidata LCP (`fetchPriority="high"`) */
  priority?: boolean;
  /**
   * Para imágenes inicialmente ocultas (ej. slides inactivos de un lightbox/carrusel):
   * aplica `fetchPriority="low"` junto con `loading="lazy"`.
   */
  lowPriorityHidden?: boolean;
  /** Placeholder Base64 para carga progresiva */
  blurDataURL?: string;
  /** Clases CSS para el contenedor exterior */
  containerClassName?: string;
  /** Clases CSS para el `<Image>` interno */
  imageClassName?: string;
  /** Texto opcional de marca de agua en capa superpuesta (Defensa en Profundidad) */
  watermarkText?: string;
  /** Contenido hijo personalizado si se desea envolver un elemento existente */
  children?: ReactNode;
}

export default function ImageShield({
  src,
  alt = "",
  fill = false,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
  lowPriorityHidden = false,
  blurDataURL,
  containerClassName = "",
  imageClassName = "",
  watermarkText,
  children,
}: ImageShieldProps) {
  const preventExtraction = (e: SyntheticEvent) => {
    e.preventDefault();
  };

  // Gestión de prioridad de red siguiendo el estándar de Core Web Vitals (LCP):
  // - Candidato LCP (`priority`): `fetchPriority="high"` sin `loading="lazy"`.
  // - Imagen oculta en carrusel/modal (`lowPriorityHidden`): `fetchPriority="low"` + `loading="lazy"`.
  // - Imagen estándar bajo el pliegue: `loading="lazy"` y omitir `fetchPriority`.
  const fetchPriorityProp: "high" | "low" | undefined = priority
    ? "high"
    : lowPriorityHidden
      ? "low"
      : undefined;

  const loadingProp: "eager" | "lazy" | undefined = priority
    ? undefined
    : "lazy";

  const isCloudinaryRemote = Boolean(src && src.includes("res.cloudinary.com"));

  return (
    <div
      onContextMenu={preventExtraction}
      onDragStart={preventExtraction}
      className={`relative overflow-hidden select-none [-webkit-touch-callout:none] [-webkit-user-select:none] ${containerClassName}`}
    >
      {children ? (
        <div className="pointer-events-none h-full w-full select-none">
          {children}
        </div>
      ) : src ? (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          width={!fill ? (width ?? 1200) : undefined}
          height={!fill ? (height ?? 1600) : undefined}
          sizes={sizes}
          priority={priority}
          fetchPriority={fetchPriorityProp}
          loading={loadingProp}
          draggable={false}
          unoptimized={isCloudinaryRemote}
          placeholder={blurDataURL ? "blur" : "empty"}
          blurDataURL={blurDataURL}
          className={`pointer-events-none select-none ${imageClassName}`}
        />
      ) : null}

      {/* Marca de agua defensiva en el DOM para sesiones de Casting Privado */}
      {watermarkText && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden p-4 select-none"
        >
          <span className="-rotate-30 border border-white/20 bg-dark-deep/25 px-3 py-1 text-center font-body text-[0.65rem] font-bold tracking-[0.26em] text-white/40 uppercase backdrop-blur-[1px] sm:text-xs">
            {watermarkText}
          </span>
        </div>
      )}

      {/* Escudo transparente superpuesto que bloquea arrastrar, clic derecho e inspección directa de la imagen */}
      <div
        aria-hidden="true"
        onContextMenu={preventExtraction}
        onDragStart={preventExtraction}
        className="absolute inset-0 z-10 bg-transparent select-none"
      />
    </div>
  );
}
