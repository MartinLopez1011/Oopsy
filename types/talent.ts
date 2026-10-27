/* ============================================================
   OOPSY — Talent & Model Agency Domain Types (types/talent.ts)

   Cumplimiento estricto Ley N° 21.719 (Protección de Datos Personales en Chile):
   Este módulo separa a nivel de sistema de tipos la entidad pública
   (`PublicTalentProfile`) de la ficha técnica confidencial B2B
   (`FullTalentCastingProfile`).

   REGLA DE ARQUITECTURA:
   - `PublicTalentProfile` se utiliza exclusivamente en `/talentos` y `/portafolio`.
     Jamás incluye medidas anatómicas (busto, cintura, cadera), calzado, peso,
     datos de contacto ni acceso a fotografías Polaroids/Digitals al natural.
   - `FullTalentCastingProfile` solo puede instanciarse dentro de `lib/repository.ts`
     tras validar un token criptográfico de Casting B2B vigente.
   ============================================================ */

import type { EditorialAspectRatio } from "@/types/portfolio";

/**
 * Estado de publicación del talento en el CMS (Google Sheets)
 */
export type TalentPublicationStatus = "Publicado" | "Borrador";

/**
 * Categorías o divisiones editoriales de talentos en Oopsy
 */
export type TalentCategory =
  | "Editorial & Couture"
  | "Runway / Pasarela"
  | "Commercial & Rostro"
  | "New Faces";

/**
 * Filtro interactivo en la vista pública `/talentos`
 */
export type TalentFilterCategory = "Todos" | TalentCategory;

/**
 * Créditos asociados al Book artístico público del talento
 */
export interface TalentEditorialCredits {
  photography?: string;
  styling?: string;
  makeupAndHair?: string;
  recentCampaigns?: string;
}

/**
 * Fotografía individual dentro del Book público o galería de Polaroids privadas
 */
export interface TalentMediaAsset {
  id: string;
  /** URL optimizada en Cloudinary con `fl_strip_profile` (y firmada si es Polaroid) */
  src: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio: EditorialAspectRatio;
  caption?: string;
  blurDataURL: string;
  /** Indica si la URL fue firmada criptográficamente con expiración corta */
  isSignedPrivate?: boolean;
  /** Timestamp UNIX (segundos) de expiración de la firma si aplica */
  expiresAtUnix?: number;
}

/**
 * Representación cruda de una fila de la pestaña "Talentos" en Google Sheets
 */
export interface RawTalentSheetRow {
  id: string;
  name: string;
  category: TalentCategory | string;
  /** Estatura general (ej: "1.78 m") — único dato físico permitido en capa pública */
  height: string;
  /** Talla de calzado (ej: "39 EU") — DATO SENSIBLE: solo B2B privado */
  shoes: string;
  /** Medida de busto/pecho en cm (ej: "82 cm") — DATO SENSIBLE: solo B2B privado */
  bust: string;
  /** Medida de cintura en cm (ej: "60 cm") — DATO SENSIBLE: solo B2B privado */
  waist: string;
  /** Medida de cadera en cm (ej: "89 cm") — DATO SENSIBLE: solo B2B privado */
  hips: string;
  /** URL o identificador de carpeta de fotos artísticas del Book público */
  book_folder_url: string;
  /** URL o identificador de carpeta privada de Polaroids/Digitals — DATO SENSIBLE */
  polaroids_folder_url: string;
  /** Imagen principal de portada del Book */
  cover_image: string;
  /** Estado de visibilidad ("Publicado" | "Borrador") */
  status: TalentPublicationStatus | string;
  /** URL opcional de video de pasarela (Runway Walk) para paquetes de casting */
  runway_video_url?: string;
  /** Créditos editoriales del Book */
  credits_photography?: string;
  credits_styling?: string;
  credits_campaigns?: string;
}

/**
 * PERFIL PÚBLICO DE TALENTO (`PublicTalentProfile`)
 *
 * Diseñado bajo el principio de minimización de datos (Ley N° 21.719).
 * Esta interfaz excluye explícitamente medidas anatómicas (`bust`, `waist`, `hips`),
 * calzado (`shoes`), carpetas crudas y galerías de `Polaroids/Digitals`.
 */
export interface PublicTalentProfile {
  /** Identificador único del talento (ej: "TAL-001") */
  id: string;
  /** Slug URL-friendly */
  slug: string;
  /** Nombre artístico o de representación del talento */
  name: string;
  /** División / categoría editorial */
  category: TalentCategory;
  /** Estatura general formateada (ej: "1.78 m") */
  height: string;
  /** URL de portada del Book optimizada (`w_1200,q_auto,f_auto,fl_strip_profile`) */
  coverImage: string;
  /** Placeholder LQIP en Base64 */
  blurDataURL: string;
  /** Proporción editorial de la tarjeta */
  aspectRatio: EditorialAspectRatio;
  /** Fotografías artísticas seleccionadas del Book (sin metadatos EXIF) */
  bookGallery: TalentMediaAsset[];
  /** Créditos de fotografía, estilismo y campañas destacadas */
  credits: TalentEditorialCredits;
  /** Estado validado: siempre "Publicado" en la capa pública */
  status: "Publicado";
}

/**
 * Medidas anatómicas confidenciales para evaluación exclusiva en Casting B2B
 */
export interface ConfidentialTalentMeasurements {
  /** Estatura general (ej: "1.78 m") */
  height: string;
  /** Busto / Pecho (ej: "82 cm") */
  bust: string;
  /** Cintura (ej: "60 cm") */
  waist: string;
  /** Cadera (ej: "89 cm") */
  hips: string;
  /** Calzado europeo/nacional (ej: "39 EU") */
  shoes: string;
}

/**
 * PERFIL COMPLETO DE CASTING PRIVADO (`FullTalentCastingProfile`)
 *
 * Extiende el perfil público incorporando la ficha técnica anatómica,
 * el video de pasarela y las Polaroids/Digitals al natural firmadas con
 * expiración temporal (15 a 30 min) y marca de agua dinámica.
 */
export interface FullTalentCastingProfile extends PublicTalentProfile {
  /**
   * Ficha técnica de medidas anatómicas.
   * Si el package tiene `show_measurements: false`, el repositorio omite estos valores (`null`).
   */
  measurements: ConfidentialTalentMeasurements | null;
  /**
   * Galería confidencial de Polaroids / Digitals al natural.
   * Todas las URLs están firmadas criptográficamente en servidor con tiempo de expiración corto
   * y marca de agua superpuesta en tiempo real vía Cloudinary.
   */
  polaroidsGallery: TalentMediaAsset[];
  /**
   * Video de pasarela (Runway Walk / Presentación) para directores de casting
   */
  runwayVideoUrl?: string;
}
