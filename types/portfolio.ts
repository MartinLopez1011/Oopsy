/* ============================================================
   OOPSY — Editorial Portfolio Types (types/portfolio.ts)
   
   Tipado estricto mapeando las columnas exactas del Google Sheets
   (CMS Headless ID: 1m3BxCEZQ1w_Wk09raXg_ohr4DJRc8MENPPWDXQBXRIE)
   y el modelo de dominio optimizado en tiempo de compilación (SSG).
   ============================================================ */

/**
 * Categorías oficiales de portafolio editorial definidas en Google Sheets
 */
export type PortfolioCategory =
  | "Sesiones Fotográficas"
  | "Eventos de Moda"
  | "Cobertura Editorial";

/**
 *Filtro activo en la UI del Portafolio (incluye "Todos")
 */
export type PortfolioFilterCategory = "Todos" | PortfolioCategory;

/**
 * Estado de publicación en Google Sheets
 * Regla crítica: Solo proyectos con Estado === "Publicado" se compilan al sitio.
 */
export type PortfolioStatus = "Publicado" | "Borrador";

/**
 * Flag booleano en español proveniente de Google Sheets
 */
export type SheetYesNo = "Sí" | "No";

/**
 * Proporción editorial para la grilla asimétrica / lookbook
 */
export type EditorialAspectRatio = "3:4" | "4:5" | "16:10" | "1:1";

/**
 * Representación exacta de una fila cruda del Google Sheets
 * Columnas de la hoja de cálculo:
 * - ID Proyecto (ej: PRJ-001)
 * - Título del Proyecto
 * - Cliente / Marca
 * - Categoría
 * - Mes / Año (formato MM/YYYY)
 * - Carpeta Drive
 * - Imagen de Portada
 * - Créditos - Fotografía
 * - Créditos - Dirección de Arte / Estilismo
 * - Créditos - Modelo
 * - Créditos - Diseñadores
 * - Créditos - Maquilladoras
 * - Créditos - Dirección Creativa
 * - Créditos - Organizadores Asociados
 * - Estado
 * - Destacado en Home
 */
export interface RawPortfolioSheetRow {
  "ID Proyecto": string;
  "Título del Proyecto": string;
  "Cliente / Marca": string;
  "Categoría": PortfolioCategory | string;
  "Mes / Año": string;
  "Carpeta Drive": string;
  "Imagen de Portada": string;
  "Créditos - Fotografía"?: string;
  "Créditos - Dirección de Arte / Estilismo"?: string;
  "Créditos - Modelo"?: string;
  "Créditos - Diseñadores"?: string;
  "Créditos - Maquilladoras"?: string;
  "Créditos - Dirección Creativa"?: string;
  "Créditos - Organizadores Asociados"?: string;
  "Estado": PortfolioStatus | string;
  "Destacado en Home": SheetYesNo | string;
}

/**
 * Asset individual de imagen dentro de la galería de un proyecto,
 * ya resuelto hacia el CDN (Cloudinary / Cloudflare R2) o ruta local optimizada.
 */
export interface PortfolioGalleryImage {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  aspectRatio: EditorialAspectRatio;
  caption?: string;
  blurDataURL?: string;
}

/**
 * Ficha técnica de créditos editoriales del proyecto.
 * Todos los campos son opcionales: si en Google Sheets una celda está vacía,
 * queda como `undefined` y NO se renderiza en el frontend.
 */
export interface PortfolioCredits {
  photography?: string;
  artDirectionAndStyling?: string;
  model?: string;
  designers?: string;
  makeup?: string;
  creativeDirection?: string;
  associatedOrganizers?: string;
}

/**
 * Entidad normalizada y optimizada para consumo estático (SSG) en componentes
 */
export interface PortfolioProject {
  /** ID único del proyecto (ej: "PRJ-001") */
  id: string;
  /** Slug URL-friendly derivado del ID y título */
  slug: string;
  /** Título editorial del proyecto */
  title: string;
  /** Nombre del cliente o marca */
  client: string;
  /** Categoría validada del proyecto */
  category: PortfolioCategory;
  /** Fecha en formato "MM/YYYY" (ej: "09/2026") */
  monthYear: string;
  /** Etiqueta legible de fecha para lookbook (ej: "SEP 2026") */
  formattedDate: string;
  /** URL original de la carpeta de Google Drive (usada solo en build-time/sync) */
  driveFolderUrl: string;
  /** ID extraído de la carpeta de Google Drive */
  driveFolderId: string | null;
  /** URL de portada optimizada en CDN (WebP/AVIF) — nunca enlace crudo de Drive */
  coverImage: string;
  /** Placeholder LQIP base64 para efecto blur progresivo en next/image */
  blurDataURL: string;
  /** Proporción editorial en la grilla asimétrica */
  aspectRatio: EditorialAspectRatio;
  /** Dimensiones intrínsecas de la imagen de portada */
  coverDimensions: {
    width: number;
    height: number;
  };
  /** Créditos editoriales (Fotografía y Dirección de Arte / Estilismo) */
  credits: PortfolioCredits;
  /** Estado validado (siempre "Publicado" en proyectos expuestos al cliente) */
  status: "Publicado";
  /** Indica si se destaca en el bloque principal del Home (`Destacado en Home === "Sí"`) */
  featuredInHome: boolean;
  /** Galería completa de fotos del proyecto para el Modal Lightbox Inmersivo */
  gallery: PortfolioGalleryImage[];
}
