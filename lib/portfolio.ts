/* ============================================================
   OOPSY — Editorial Portfolio Data Service (lib/portfolio.ts)
   
   Arquitectura 100% SSG + Deploy Hook (Build-Time Only):
   - Lee y parsea los metadatos desde Google Sheets (ID por defecto:
     1m3BxCEZQ1w_Wk09raXg_ohr4DJRc8MENPPWDXQBXRIE) en tiempo de
     compilación (next build) vía CSV de exportación o Google Sheets API v4.
   - Filtra estrictamente: SOLO filas con `Estado === "Publicado"`.
   - NUNCA expone URLs crudas de Google Drive al navegador del cliente.
     Transforma nombres de archivo y carpetas de Drive hacia nuestro CDN
     (Cloudinary / Cloudflare R2 / carpeta pública sincronizada en WebP/AVIF).
   - Incluye un fallback editorial curado de alta costura mientras se
     configuran las credenciales de entorno o permisos de la hoja.
   ============================================================ */

import type {
  EditorialAspectRatio,
  PortfolioCategory,
  PortfolioGalleryImage,
  PortfolioProject,
  RawPortfolioSheetRow,
} from "@/types/portfolio";

/** ID oficial del Google Sheets de Portafolio Oopsy */
export const DEFAULT_GOOGLE_SHEET_ID =
  "1m3BxCEZQ1w_Wk09raXg_ohr4DJRc8MENPPWDXQBXRIE";

/** Categorías válidas permitidas por el esquema del CMS */
const VALID_CATEGORIES: readonly PortfolioCategory[] = [
  "Sesiones Fotográficas",
  "Eventos de Moda",
  "Cobertura Editorial",
];

/** Nombres cortos de meses en español para formato lookbook */
const MONTH_NAMES_ES: Record<string, string> = {
  "01": "ENE",
  "02": "FEB",
  "03": "MAR",
  "04": "ABR",
  "05": "MAY",
  "06": "JUN",
  "07": "JUL",
  "08": "AGO",
  "09": "SEP",
  "10": "OCT",
  "11": "NOV",
  "12": "DIC",
};

/**
 * Genera un placeholder SVG minimalista codificado en Base64 para `blurDataURL`
 * de `next/image`, respetando la paleta cálida de Oopsy (#f4ecdf / #3a3835).
 */
export function createEditorialBlurDataURL(
  primaryHex = "#f4ecdf",
  accentHex = "#e8e5e0"
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${primaryHex}"/><stop offset="100%" stop-color="${accentHex}"/></linearGradient></defs><rect width="40" height="50" fill="url(#g)"/></svg>`;
  const base64 = Buffer.from(svg).toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

/**
 * Extrae el ID de una carpeta o archivo desde una URL de Google Drive
 */
export function extractDriveFolderId(driveUrl: string): string | null {
  if (!driveUrl) return null;
  const trimmed = driveUrl.trim();

  // Formato: https://drive.google.com/drive/folders/1a2b3c4d5e...
  const folderMatch = trimmed.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (folderMatch?.[1]) return folderMatch[1];

  // Formato: ?id=1a2b3c4d5e...
  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idParamMatch?.[1]) return idParamMatch[1];

  // Si ya es un ID alfanumérico directo
  if (/^[a-zA-Z0-9_-]{15,}$/.test(trimmed)) return trimmed;

  return null;
}

/**
 * Verifica si una URL apunta directamente a Google Drive (prohibido en `<img />` cliente)
 */
function isRawGoogleDriveUrl(url: string): boolean {
  return /drive\.google\.com|docs\.google\.com\/uc/i.test(url);
}

/**
 * Construye la URL "Puente" (Etapa 2):
 * Si `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` está configurado (ej. `kyzll4ja`),
 * pasa la foto de Google Drive por el motor de optimización y caché de Cloudinary (`image/fetch/f_auto,q_auto,w_1600`),
 * convirtiendo fotos pesadas de 10MB en WebP/AVIF ligeras (~45KB - 250KB) servidas desde el CDN de Cloudinary.
 */
export function buildDriveToCloudinaryFetchUrl(driveFileId: string): string {
  const googleSourceUrl = `https://lh3.googleusercontent.com/d/${driveFileId}`;
  const cloudinaryCloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || "kyzll4ja";

  if (
    cloudinaryCloudName &&
    cloudinaryCloudName !== "your-cloud-name" &&
    cloudinaryCloudName !== "undefined"
  ) {
    return `https://res.cloudinary.com/${cloudinaryCloudName}/image/fetch/f_auto,q_auto,w_1600/${googleSourceUrl}`;
  }

  return googleSourceUrl;
}

/**
 * Resuelve la URL de una imagen (portada o asset de galería) hacia el CDN configurado
 * (Cloudinary Fetch / Upload, Cloudflare R2 o directorio local `/images/portfolio`).
 * Jamás retorna un enlace crudo de Google Drive al cliente.
 */
export function resolveOptimizedAssetUrl(
  projectId: string,
  rawImageField: string,
  driveFolderUrl: string,
  fallbackUrl: string
): string {
  const cleanId = projectId.trim().toLowerCase();
  const imageValue = rawImageField.trim();

  // 1. Si es un enlace de Google Drive a un archivo específico, pasarlo por el Puente Cloudinary Fetch CDN
  const driveFileMatch =
    imageValue.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    imageValue.match(/id=([a-zA-Z0-9_-]+)/);
  if (driveFileMatch?.[1]) {
    return buildDriveToCloudinaryFetchUrl(driveFileMatch[1]);
  }

  // Si ya es un enlace directo a lh3.googleusercontent.com/d/ID, pasarlo también por Cloudinary Fetch CDN
  const lhMatch = imageValue.match(
    /^https:\/\/lh\d*\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i
  );
  if (lhMatch?.[1]) {
    return buildDriveToCloudinaryFetchUrl(lhMatch[1]);
  }

  // 2. Si ya es una URL absoluta optimizada (ej. Cloudinary, R2, Unsplash) y NO es Google Drive:
  if (
    /^https?:\/\//i.test(imageValue) &&
    !isRawGoogleDriveUrl(imageValue)
  ) {
    return imageValue;
  }

  // 3. Si empieza con "/" es una ruta local dentro de /public (ej: /images/portfolio/prj-001/portada.webp)
  if (imageValue.startsWith("/")) {
    return imageValue;
  }

  // Normalizar nombre de archivo (forzando extensión optimizada si se usa pipeline de CDN)
  const fileName = imageValue || "portada.webp";
  const baseNameWithoutExt = fileName.replace(/\.[a-zA-Z0-9]+$/, "");
  const cdnBaseUrl = process.env.NEXT_PUBLIC_PORTFOLIO_CDN_URL?.replace(
    /\/+$/,
    ""
  );
  const cloudinaryCloudName =
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() || "kyzll4ja";

  // 4. Si se especificó explícitamente un identificador de Cloudinary (ej: "cloudinary:mi-foto" o "cld:oopsy/...")
  const isExplicitCloudinary =
    imageValue.startsWith("cloudinary:") ||
    imageValue.startsWith("cld:") ||
    imageValue.includes("res.cloudinary.com");

  if (
    isExplicitCloudinary &&
    cloudinaryCloudName &&
    cloudinaryCloudName !== "your-cloud-name" &&
    cloudinaryCloudName !== "undefined"
  ) {
    const cleanPublicId = imageValue
      .replace(/^(cloudinary:|cld:)/, "")
      .replace(/^\/+/, "")
      .replace(/\.[a-zA-Z0-9]+$/, "");

    return `https://res.cloudinary.com/${cloudinaryCloudName}/image/upload/f_auto,q_auto,w_1600/${cleanPublicId}`;
  }

  // 5. Resolución vía CDN dedicado (Cloudflare R2 / S3 / Vercel Blob)
  if (
    cdnBaseUrl &&
    !cdnBaseUrl.includes("example.com") &&
    cdnBaseUrl !== "undefined"
  ) {
    const normalizedFile = /\.(webp|avif|jpg|jpeg|png)$/i.test(fileName)
      ? fileName
      : `${baseNameWithoutExt}.webp`;
    return `${cdnBaseUrl}/${cleanId}/${normalizedFile}`;
  }

  // 6. Si no hay CDN externo configurado o el archivo no existe en CDN,
  // retornar el fallback seguro optimizado de alta estética editorial.
  void driveFolderUrl;
  return fallbackUrl;
}

/**
 * Convierte "MM/YYYY" (ej: "09/2026") a formato editorial ("SEP 2026")
 */
export function formatMonthYear(monthYear: string): string {
  const cleaned = monthYear.trim();
  const match = cleaned.match(/^(\d{1,2})\/(\d{4})$/);
  if (!match) return cleaned.toUpperCase();

  const monthPadded = match[1].padStart(2, "0");
  const year = match[2];
  const monthLabel = MONTH_NAMES_ES[monthPadded] || monthPadded;
  return `${monthLabel} ${year}`;
}

/**
 * Normaliza y valida la categoría proveniente del Sheet
 */
function normalizeCategory(raw: string): PortfolioCategory {
  const cleaned = raw.trim();
  const found = VALID_CATEGORIES.find(
    (cat) => cat.toLowerCase() === cleaned.toLowerCase()
  );
  if (found) return found;

  // Mapeo tolerante por palabras clave
  if (/evento|desfile|showroom/i.test(cleaned)) return "Eventos de Moda";
  if (/editorial|cobertura|pr|backstage/i.test(cleaned))
    return "Cobertura Editorial";
  return "Sesiones Fotográficas";
}

/**
 * Asigna una proporción editorial asimétrica determinística según el índice o ID
 * para lograr un ritmo visual de lookbook (3:4 vertical, 4:5 vertical medio, 16:10 horizontal)
 */
function getEditorialAspectByIndex(index: number): {
  aspectRatio: EditorialAspectRatio;
  width: number;
  height: number;
} {
  const pattern: Array<{
    aspectRatio: EditorialAspectRatio;
    width: number;
    height: number;
  }> = [
    { aspectRatio: "3:4", width: 1200, height: 1600 },
    { aspectRatio: "4:5", width: 1200, height: 1500 },
    { aspectRatio: "3:4", width: 1200, height: 1600 },
    { aspectRatio: "16:10", width: 1600, height: 1000 },
    { aspectRatio: "4:5", width: 1200, height: 1500 },
    { aspectRatio: "3:4", width: 1200, height: 1600 },
  ];
  return pattern[index % pattern.length];
}

/**
 * Parser RFC 4180 para CSV exportado de Google Sheets (soporta comillas, comas y saltos de línea internos)
 */
export function parseGoogleSheetCsv(csvText: string): RawPortfolioSheetRow[] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField.trim());
        currentField = "";
      } else if (char === "\r" && nextChar === "\n") {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
        i++;
      } else if (char === "\n") {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else {
        currentField += char;
      }
    }
  }

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  // Encontrar la fila que contiene los encabezados reales (ej: "ID Proyecto")
  const headerRowIndex = rows.findIndex((r) =>
    r.some((cell) => cell.includes("ID Proyecto"))
  );
  if (headerRowIndex === -1) return [];

  // Normalizar encabezados para que si la columna dice "Oopsy - Portafolio de Moda y Fotografía ID Proyecto" se mapee a "ID Proyecto"
  const normalizedHeaders = rows[headerRowIndex].map((rawHeader) => {
    const clean = rawHeader.replace(/^\uFEFF/, "").trim();
    if (clean.includes("ID Proyecto")) return "ID Proyecto";
    if (clean.includes("Título del Proyecto")) return "Título del Proyecto";
    if (clean.includes("Cliente / Marca")) return "Cliente / Marca";
    if (clean.includes("Categoría")) return "Categoría";
    if (clean.includes("Mes / Año")) return "Mes / Año";
    if (clean.includes("Carpeta Drive")) return "Carpeta Drive";
    if (clean.includes("Imagen de Portada")) return "Imagen de Portada";
    if (clean.includes("Créditos - Fotografía")) return "Créditos - Fotografía";
    if (clean.includes("Créditos - Dirección de Arte")) return "Créditos - Dirección de Arte / Estilismo";
    if (clean.includes("Estado")) return "Estado";
    if (clean.includes("Destacado en Home")) return "Destacado en Home";
    return clean;
  });

  const dataRows = rows.slice(headerRowIndex + 1);

  return dataRows
    .filter((r) => r.some((cell) => cell.length > 0))
    .map((cells) => {
      const record: Record<string, string> = {};
      normalizedHeaders.forEach((header, idx) => {
        if (header) {
          record[header] = cells[idx] ?? "";
        }
      });
      return record as unknown as RawPortfolioSheetRow;
    });
}

/* ============================================================
   FALLBACK EDITORIAL DE ALTA COSTURA (Build-Time Mock / Demo)
   Se utiliza automáticamente mientras se configuran las credenciales
   de Google Sheets/CDN o cuando la hoja aún no es pública.
   Incluye filas en "Borrador" en la fuente cruda para verificar el
   filtrado estricto `Estado === "Publicado"`.
   ============================================================ */

interface FallbackProjectSeed extends RawPortfolioSheetRow {
  _fallbackCover: string;
  _fallbackAspect: EditorialAspectRatio;
  _fallbackWidth: number;
  _fallbackHeight: number;
  _fallbackBlurHex: [string, string];
  _fallbackGallery: Array<{
    src: string;
    alt: string;
    width: number;
    height: number;
    aspectRatio: EditorialAspectRatio;
    caption?: string;
  }>;
}

const EDITORIAL_FALLBACK_SEEDS: FallbackProjectSeed[] = [
  {
    "ID Proyecto": "PRJ-001",
    "Título del Proyecto": "SILENCIO MINERAL AW26",
    "Cliente / Marca": "Atelier Kósmos",
    "Categoría": "Sesiones Fotográficas",
    "Mes / Año": "09/2026",
    "Carpeta Drive":
      "https://drive.google.com/drive/folders/1A2B3C_oopsy_prj001",
    "Imagen de Portada": "portada.jpg",
    "Créditos - Fotografía": "Valentina Moraga & Estudio Oopsy",
    "Créditos - Dirección de Arte / Estilismo":
      "Camila Ríos (Dir. Arte) · Sofía Larraín (Styling)",
    "Estado": "Publicado",
    "Destacado en Home": "Sí",
    _fallbackCover:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=85",
    _fallbackAspect: "3:4",
    _fallbackWidth: 1200,
    _fallbackHeight: 1600,
    _fallbackBlurHex: ["#e8e0d5", "#c8beb2"],
    _fallbackGallery: [
      {
        src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1600&q=85",
        alt: "Silencio Mineral AW26 — Look 01 en abrigo estructurado de lana virgen",
        width: 1200,
        height: 1600,
        aspectRatio: "3:4",
        caption: "Look 01 — Abrigo escultural en lana merino cruda.",
      },
      {
        src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1600&q=85",
        alt: "Silencio Mineral AW26 — Look 02 monocromático en locación brutalista",
        width: 1200,
        height: 1500,
        aspectRatio: "4:5",
        caption: "Look 02 — Silueta fluida frente a hormigón arquitectónico.",
      },
      {
        src: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1600&q=85",
        alt: "Silencio Mineral AW26 — Detalle de textura y movimiento",
        width: 1600,
        height: 1000,
        aspectRatio: "16:10",
        caption: "Plano general — Secuencia de movimiento en exterior.",
      },
      {
        src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1600&q=85",
        alt: "Silencio Mineral AW26 — Retrato editorial de belleza natural",
        width: 1200,
        height: 1600,
        aspectRatio: "3:4",
        caption: "Retrato — Iluminación cenital difusa y piel orgánica.",
      },
    ],
  },
  {
    "ID Proyecto": "PRJ-002",
    "Título del Proyecto": "NOCTURNA RUNWAY SHOW",
    "Cliente / Marca": "Maison Velours",
    "Categoría": "Eventos de Moda",
    "Mes / Año": "08/2026",
    "Carpeta Drive":
      "https://drive.google.com/drive/folders/1A2B3C_oopsy_prj002",
    "Imagen de Portada": "portada.jpg",
    "Créditos - Fotografía": "Matías Errázuriz (Runway & Backstage)",
    "Créditos - Dirección de Arte / Estilismo":
      "Oopsy Production Team · Escenografía Lumínica: Studio Vértice",
    "Estado": "Publicado",
    "Destacado en Home": "Sí",
    _fallbackCover:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1400&q=85",
    _fallbackAspect: "4:5",
    _fallbackWidth: 1200,
    _fallbackHeight: 1500,
    _fallbackBlurHex: ["#302e2c", "#4a4745"],
    _fallbackGallery: [
      {
        src: "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1600&q=85",
        alt: "Nocturna Runway Show — Colección en backstage previo a salida",
        width: 1200,
        height: 1500,
        aspectRatio: "4:5",
        caption: "Backstage — Selección final de piezas sobre rack industrial.",
      },
      {
        src: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1600&q=85",
        alt: "Nocturna Runway Show — Detalle de texturas de alta costura",
        width: 1600,
        height: 1000,
        aspectRatio: "16:10",
        caption: "Primer plano — Seda plisada y acabados hechos a mano.",
      },
      {
        src: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&w=1600&q=85",
        alt: "Nocturna Runway Show — Salida principal en pasarela",
        width: 1200,
        height: 1600,
        aspectRatio: "3:4",
        caption: "Pasarela — Apertura del desfile en nave industrial de Santiago.",
      },
    ],
  },
  {
    "ID Proyecto": "PRJ-003",
    "Título del Proyecto": "CRÓNICA DE UN INTERLUDIO",
    "Cliente / Marca": "L'Officiel Sudamérica",
    "Categoría": "Cobertura Editorial",
    "Mes / Año": "07/2026",
    "Carpeta Drive":
      "https://drive.google.com/drive/folders/1A2B3C_oopsy_prj003",
    "Imagen de Portada": "portada.jpg",
    "Créditos - Fotografía": "Antonia Valdés",
    "Créditos - Dirección de Arte / Estilismo":
      "Ignacio Puga (Dirección Creativa) · Clara Montes (Estilismo)",
    "Estado": "Publicado",
    "Destacado en Home": "Sí",
    _fallbackCover:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=85",
    _fallbackAspect: "3:4",
    _fallbackWidth: 1200,
    _fallbackHeight: 1600,
    _fallbackBlurHex: ["#d8d2c9", "#9e968c"],
    _fallbackGallery: [
      {
        src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1600&q=85",
        alt: "Crónica de un Interludio — Portada editorial en sastrería deconstruida",
        width: 1200,
        height: 1600,
        aspectRatio: "3:4",
        caption: "Editorial — Sastrería oversize en tonos tierra y carbón.",
      },
      {
        src: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1600&q=85",
        alt: "Crónica de un Interludio — Retrato en luz natural de tarde",
        width: 1600,
        height: 1000,
        aspectRatio: "16:10",
        caption: "Secuencia 02 — Contraluz cálido sobre lino orgánico.",
      },
      {
        src: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1600&q=85",
        alt: "Crónica de un Interludio — Actitud editorial en estudio",
        width: 1200,
        height: 1600,
        aspectRatio: "3:4",
        caption: "Secuencia 03 — Contraste cromático y dirección de pose.",
      },
    ],
  },
  {
    "ID Proyecto": "PRJ-004",
    "Título del Proyecto": "BOTÁNICA DE CRISTAL SS27",
    "Cliente / Marca": "Cecilie & Co.",
    "Categoría": "Sesiones Fotográficas",
    "Mes / Año": "06/2026",
    "Carpeta Drive":
      "https://drive.google.com/drive/folders/1A2B3C_oopsy_prj004",
    "Imagen de Portada": "portada.jpg",
    "Créditos - Fotografía": "Gaspar Huidobro",
    "Créditos - Dirección de Arte / Estilismo":
      "Oopsy Creative Lab · Arte Floral: Taller Silvestre",
    "Estado": "Publicado",
    "Destacado en Home": "Sí",
    _fallbackCover:
      "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=85",
    _fallbackAspect: "16:10",
    _fallbackWidth: 1600,
    _fallbackHeight: 1000,
    _fallbackBlurHex: ["#f7c4db", "#fff6e6"],
    _fallbackGallery: [
      {
        src: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1600&q=85",
        alt: "Botánica de Cristal SS27 — Panorama en invernadero histórico",
        width: 1600,
        height: 1000,
        aspectRatio: "16:10",
        caption: "Campaña SS27 — Organza translúcida y volúmenes románticos.",
      },
      {
        src: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1600&q=85",
        alt: "Botánica de Cristal SS27 — Retrato cercano en tonos pastel",
        width: 1200,
        height: 1500,
        aspectRatio: "4:5",
        caption: "Beauty Look — Piel satinada con acentos florales.",
      },
      {
        src: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1600&q=85",
        alt: "Botánica de Cristal SS27 — Silueta completa a contraluz",
        width: 1200,
        height: 1600,
        aspectRatio: "3:4",
        caption: "Look 04 — Vestido en capas de tul plisado.",
      },
    ],
  },
  {
    "ID Proyecto": "PRJ-005",
    "Título del Proyecto": "ARCHIVO BRUTALISTA SHOWROOM",
    "Cliente / Marca": "Nómada Studio",
    "Categoría": "Eventos de Moda",
    "Mes / Año": "05/2026",
    "Carpeta Drive":
      "https://drive.google.com/drive/folders/1A2B3C_oopsy_prj005",
    "Imagen de Portada": "portada.jpg",
    "Créditos - Fotografía": "Diego Santelices",
    "Créditos - Dirección de Arte / Estilismo":
      "Dirección de Arte: Oopsy · Curaduría de Espacio: Galería Cima",
    "Estado": "Publicado",
    "Destacado en Home": "Sí",
    _fallbackCover:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1400&q=85",
    _fallbackAspect: "4:5",
    _fallbackWidth: 1200,
    _fallbackHeight: 1500,
    _fallbackBlurHex: ["#d4eeb3", "#f4ecdf"],
    _fallbackGallery: [
      {
        src: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=1600&q=85",
        alt: "Archivo Brutalista Showroom — Instalación textil y presentación privada",
        width: 1200,
        height: 1500,
        aspectRatio: "4:5",
        caption: "Showroom — Instalación espacial para prensa y compradores.",
      },
      {
        src: "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1600&q=85",
        alt: "Archivo Brutalista Showroom — Recorrido de colección cápsula",
        width: 1600,
        height: 1000,
        aspectRatio: "16:10",
        caption: "Arquitectura Efímera — Mobiliario de acero cepillado y piedra.",
      },
    ],
  },
  {
    "ID Proyecto": "PRJ-006",
    "Título del Proyecto": "BACKSTAGE DIARIES: SANTIAGO FASHION WEEK",
    "Cliente / Marca": "Vogue Latinoamérica / Especial",
    "Categoría": "Cobertura Editorial",
    "Mes / Año": "04/2026",
    "Carpeta Drive":
      "https://drive.google.com/drive/folders/1A2B3C_oopsy_prj006",
    "Imagen de Portada": "portada.jpg",
    "Créditos - Fotografía": "Valentina Moraga & Colectivo Oopsy",
    "Créditos - Dirección de Arte / Estilismo":
      "Producción Editorial: Oopsy PR · Styling General: Fernanda Lira",
    "Estado": "Publicado",
    "Destacado en Home": "Sí",
    _fallbackCover:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=85",
    _fallbackAspect: "3:4",
    _fallbackWidth: 1200,
    _fallbackHeight: 1600,
    _fallbackBlurHex: ["#8cd3db", "#f4ecdf"],
    _fallbackGallery: [
      {
        src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=85",
        alt: "Backstage Diaries — Retrato íntimo antes de salir a pasarela",
        width: 1200,
        height: 1600,
        aspectRatio: "3:4",
        caption: "Backstage — Últimos ajustes de estilismo a 60 segundos del show.",
      },
      {
        src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1600&q=85",
        alt: "Backstage Diaries — Fitting y pruebas de iluminación",
        width: 1200,
        height: 1500,
        aspectRatio: "4:5",
        caption: "Fitting — Polaroids de control y continuidad de vestuario.",
      },
      {
        src: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1600&q=85",
        alt: "Backstage Diaries — Cierre de jornada con el equipo de modelos",
        width: 1600,
        height: 1000,
        aspectRatio: "16:10",
        caption: "Final — Cobertura insider exclusiva para prensa especializada.",
      },
    ],
  },
  {
    "ID Proyecto": "PRJ-007",
    "Título del Proyecto": "GEOMETRÍA DEL DESIERTO (CAMPAÑA INÉDITA)",
    "Cliente / Marca": "Casa Atacama",
    "Categoría": "Sesiones Fotográficas",
    "Mes / Año": "10/2026",
    "Carpeta Drive":
      "https://drive.google.com/drive/folders/1A2B3C_oopsy_prj007",
    "Imagen de Portada": "portada.jpg",
    "Créditos - Fotografía": "Valentina Moraga",
    "Créditos - Dirección de Arte / Estilismo": "Camila Ríos",
    "Estado": "Borrador", // <-- Regla crítica: Esta fila DEBE ser ignorada siempre
    "Destacado en Home": "Sí",
    _fallbackCover:
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=85",
    _fallbackAspect: "3:4",
    _fallbackWidth: 1200,
    _fallbackHeight: 1600,
    _fallbackBlurHex: ["#f4ecdf", "#e8e5e0"],
    _fallbackGallery: [],
  },
];

export interface DriveFolderFile {
  id: string;
  name: string;
  cdnUrl: string;
}

/**
 * Consulta la vista pública de una carpeta de Google Drive (`embeddedfolderview`)
 * en tiempo de compilación (SSG) para descubrir automáticamente todas las fotografías
 * dentro de la carpeta sin requerir que el usuario copie link por link.
 */
export async function fetchDriveFolderImages(
  folderId: string
): Promise<DriveFolderFile[]> {
  if (!folderId) return [];

  try {
    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${encodeURIComponent(
      folderId
    )}#list`;
    const res = await fetch(embedUrl, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return [];
    const html = await res.text();

    const files: DriveFolderFile[] = [];
    const entryRegex =
      /id="entry-([a-zA-Z0-9_-]+)"[\s\S]*?<div class="flip-entry-title">([^<]+)<\/div>/g;

    let match: RegExpExecArray | null;
    while ((match = entryRegex.exec(html)) !== null) {
      const fileId = match[1];
      const fileName = match[2].trim();

      // Filtrar solo archivos de imagen (jpg, jpeg, png, webp, avif, gif)
      if (/\.(jpe?g|png|webp|avif|gif)$/i.test(fileName)) {
        files.push({
          id: fileId,
          name: fileName,
          cdnUrl: buildDriveToCloudinaryFetchUrl(fileId),
        });
      }
    }

    // Ordenar alfabéticamente por nombre de archivo (ej: gato1.jpg, gato2.jpg, gato3.jpg...)
    files.sort((a, b) =>
      a.name.localeCompare(b.name, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    );

    return files;
  } catch (err) {
    console.warn(
      `[Google Drive] ⚠️ No se pudieron listar archivos de la carpeta ${folderId}:`,
      err
    );
    return [];
  }
}

/**
 * Extrae URLs de carpetas de Google Drive incrustadas como "Smart Chips" en Google Sheets
 * (cuando el CSV exporta el nombre de la carpeta como "Prueba" en lugar del URL completo).
 */
async function fetchSheetSmartChipFolderUrls(
  sheetId: string
): Promise<string[]> {
  try {
    const sheetEditUrl = `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
      sheetId
    )}/edit?usp=sharing`;
    const res = await fetch(sheetEditUrl, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];

    const html = await res.text();
    const urls: string[] = [];
    const folderRegex =
      /https:\/\/drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/g;

    let match: RegExpExecArray | null;
    while ((match = folderRegex.exec(html)) !== null) {
      const fullUrl = `https://drive.google.com/drive/folders/${match[1]}`;
      if (!urls.includes(fullUrl)) {
        urls.push(fullUrl);
      }
    }
    return urls;
  } catch {
    return [];
  }
}

/**
 * Transforma una lista de filas crudas (`RawPortfolioSheetRow`) en objetos
 * `PortfolioProject`, aplicando la regla crítica:
 * Filtrar e ignorar cualquier fila cuyo `Estado` no sea exactamente `"Publicado"`.
 */
export function normalizePortfolioRows(
  rows: RawPortfolioSheetRow[],
  folderFilesById?: Record<string, DriveFolderFile[]>
): PortfolioProject[] {
  // REGLA CRÍTICA: Ignorar cualquier fila cuyo estado no sea "Publicado"
  const publishedRows = rows.filter(
    (row) => row["Estado"]?.trim().toLowerCase() === "publicado"
  );

  return publishedRows.map((row, index) => {
    const id =
      row["ID Proyecto"]?.trim() || `PRJ-${String(index + 1).padStart(3, "0")}`;
    const title = row["Título del Proyecto"]?.trim() || "Proyecto Editorial";
    const client = row["Cliente / Marca"]?.trim() || "Oopsy Editorial";
    const category = normalizeCategory(
      row["Categoría"] || "Sesiones Fotográficas"
    );
    const monthYear = row["Mes / Año"]?.trim() || "09/2026";
    const driveFolderUrl = row["Carpeta Drive"]?.trim() || "";
    const driveFolderId = extractDriveFolderId(driveFolderUrl);

    // Archivos descubiertos automáticamente dentro de la Carpeta Drive
    const discoveredFiles =
      (driveFolderId && folderFilesById?.[driveFolderId]) || [];

    // Buscar si existe semilla de fallback para enriquecer dimensiones/galería por defecto
    const matchingFallback =
      EDITORIAL_FALLBACK_SEEDS.find(
        (seed) => seed["ID Proyecto"].toLowerCase() === id.toLowerCase()
      ) ||
      EDITORIAL_FALLBACK_SEEDS[index % (EDITORIAL_FALLBACK_SEEDS.length - 1)];

    const defaultDims = getEditorialAspectByIndex(index);
    const aspectRatio =
      matchingFallback?._fallbackAspect || defaultDims.aspectRatio;
    const width = matchingFallback?._fallbackWidth || defaultDims.width;
    const height = matchingFallback?._fallbackHeight || defaultDims.height;

    const rawCoverField = row["Imagen de Portada"]?.trim() || "";

    // Si en "Imagen de Portada" pusieron el nombre de un archivo (ej: "gato1.jpg")
    // que está dentro de la carpeta Drive, o lo dejaron vacío, buscarlo en discoveredFiles:
    const matchedFileInFolder = rawCoverField
      ? discoveredFiles.find(
          (f) => f.name.toLowerCase() === rawCoverField.toLowerCase()
        )
      : discoveredFiles[0];

    const fallbackCoverToUse =
      matchedFileInFolder?.cdnUrl ||
      discoveredFiles[0]?.cdnUrl ||
      matchingFallback._fallbackCover;

    const coverImage = matchedFileInFolder
      ? matchedFileInFolder.cdnUrl
      : resolveOptimizedAssetUrl(
          id,
          rawCoverField || "portada.webp",
          driveFolderUrl,
          fallbackCoverToUse
        );

    const blurColors = matchingFallback?._fallbackBlurHex || [
      "#f4ecdf",
      "#e8e5e0",
    ];
    const blurDataURL = createEditorialBlurDataURL(
      blurColors[0],
      blurColors[1]
    );

    const isCustomProject = !EDITORIAL_FALLBACK_SEEDS.some(
      (seed) => seed["ID Proyecto"].toLowerCase() === id.toLowerCase()
    );

    let gallery: PortfolioGalleryImage[] = [];

    if (discoveredFiles.length > 0) {
      // Construir la galería completa con TODAS las fotos encontradas en la Carpeta Drive
      // Colocando la imagen de portada primero para consistencia visual
      const orderedFiles = [...discoveredFiles].sort((a, b) => {
        if (a.cdnUrl === coverImage) return -1;
        if (b.cdnUrl === coverImage) return 1;
        return 0;
      });

      gallery = orderedFiles.map((file, imgIdx) => {
        const dims = getEditorialAspectByIndex(imgIdx);
        return {
          id: `${id}-drive-${file.id}`,
          src: file.cdnUrl,
          alt: `${title} — ${file.name.replace(/\.[a-zA-Z0-9]+$/, "")}`,
          width: dims.width,
          height: dims.height,
          aspectRatio: dims.aspectRatio,
          caption: `${title} · ${file.name.replace(/\.[a-zA-Z0-9]+$/, "")}`,
          blurDataURL,
        };
      });
    } else if (isCustomProject) {
      gallery = [
        {
          id: `${id}-img-1`,
          src: coverImage,
          alt: `${title} — ${client}`,
          width,
          height,
          aspectRatio,
          caption: `Producción ${title} (${category})`,
          blurDataURL,
        },
      ];
    } else {
      gallery = (matchingFallback?._fallbackGallery || []).map(
        (item, imgIdx) => ({
          id: `${id}-img-${imgIdx + 1}`,
          src:
            imgIdx === 0
              ? coverImage
              : resolveOptimizedAssetUrl(
                  id,
                  `look-${String(imgIdx + 1).padStart(2, "0")}.webp`,
                  driveFolderUrl,
                  item.src
                ),
          alt: item.alt || `${title} — Toma ${imgIdx + 1}`,
          width: item.width,
          height: item.height,
          aspectRatio: item.aspectRatio,
          caption: item.caption,
          blurDataURL,
        })
      );
    }

    const featuredRaw = row["Destacado en Home"]?.trim().toLowerCase() || "";
    const featuredInHome =
      featuredRaw === "sí" || featuredRaw === "si" || featuredRaw === "true";

    const slug = `${id}-${title}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return {
      id,
      slug,
      title,
      client,
      category,
      monthYear,
      formattedDate: formatMonthYear(monthYear),
      driveFolderUrl,
      driveFolderId,
      coverImage,
      blurDataURL,
      aspectRatio,
      coverDimensions: { width, height },
      credits: {
        photography:
          row["Créditos - Fotografía"]?.trim() || "Oopsy Editorial Studio",
        artDirectionAndStyling:
          row["Créditos - Dirección de Arte / Estilismo"]?.trim() ||
          "Dirección Creativa Oopsy",
      },
      status: "Publicado",
      featuredInHome,
      gallery,
    };
  });
}

/**
 * Intenta obtener las filas desde Google Sheets en Build Time (SSG).
 * Soporta dos métodos sin impacto en runtime:
 * 1. Google Sheets API v4 (si `GOOGLE_SHEETS_API_KEY` está configurada)
 * 2. CSV de exportación pública (`GOOGLE_SHEETS_CSV_URL` o mediante el Sheet ID)
 */
async function fetchRowsFromGoogleSheets(): Promise<RawPortfolioSheetRow[] | null> {
  const sheetId =
    process.env.GOOGLE_SHEETS_PORTFOLIO_ID?.trim() || DEFAULT_GOOGLE_SHEET_ID;
  const sheetRange =
    process.env.GOOGLE_SHEETS_PORTFOLIO_RANGE?.trim() || "A1:K100";
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY?.trim();
  const customCsvUrl = process.env.GOOGLE_SHEETS_CSV_URL?.trim();

  // Método 1: Google Sheets API v4 con API Key en build time
  if (
    apiKey &&
    apiKey !== "your-google-sheets-api-key" &&
    apiKey !== "undefined"
  ) {
    try {
      const apiUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
        sheetId
      )}/values/${encodeURIComponent(sheetRange)}?key=${encodeURIComponent(
        apiKey
      )}`;
      const res = await fetch(apiUrl, { next: { revalidate: 60 } });
      if (res.ok) {
        const data = (await res.json()) as { values?: string[][] };
        if (data.values && data.values.length >= 2) {
          const headers = data.values[0].map((h) => h.trim());
          return data.values.slice(1).map((cells) => {
            const record: Record<string, string> = {};
            headers.forEach((header, idx) => {
              record[header] = (cells[idx] ?? "").trim();
            });
            return record as unknown as RawPortfolioSheetRow;
          });
        }
      }
    } catch {
      // Fallback silencioso a CSV o semillas editoriales en caso de error de red en build
    }
  }

  // Método 2: Exportación CSV de lectura en build time (usando el endpoint gviz de Google Sheets que responde con permisos "Cualquier persona con el enlace")
  const csvUrl =
    customCsvUrl &&
    customCsvUrl !== "undefined" &&
    !customCsvUrl.includes("your-")
      ? customCsvUrl
      : `https://docs.google.com/spreadsheets/d/${encodeURIComponent(
          sheetId
        )}/gviz/tq?tqx=out:csv`;

  try {
    const res = await fetch(csvUrl, {
      next: { revalidate: 60 },
    });

    if (res.ok) {
      const text = await res.text();
      // Validar que no sea una pantalla de login HTML de Google
      if (
        !text.trim().startsWith("<!DOCTYPE") &&
        (text.includes("ID Proyecto") || text.includes("Estado"))
      ) {
        const parsed = parseGoogleSheetCsv(text);
        if (parsed.length > 0) {
          // Resolver Smart Chips de carpetas Drive si alguna fila tiene el nombre del chip en lugar del URL
          const needsSmartChipResolution = parsed.some(
            (r) =>
              r["Estado"]?.trim().toLowerCase() === "publicado" &&
              r["Carpeta Drive"] &&
              !extractDriveFolderId(r["Carpeta Drive"])
          );

          if (needsSmartChipResolution) {
            const chipFolderUrls = await fetchSheetSmartChipFolderUrls(sheetId);

            // Excluir los Folder IDs que ya están escritos explícitamente como URL en alguna fila
            const explicitFolderIds = new Set(
              parsed
                .map((r) => extractDriveFolderId(r["Carpeta Drive"] || ""))
                .filter((id): id is string => Boolean(id))
            );

            const availableChipUrls = chipFolderUrls.filter((url) => {
              const id = extractDriveFolderId(url);
              return id && !explicitFolderIds.has(id);
            });

            let chipIdx = 0;
            for (const row of parsed) {
              if (
                row["Carpeta Drive"] &&
                !extractDriveFolderId(row["Carpeta Drive"])
              ) {
                const resolvedUrl =
                  availableChipUrls[chipIdx] || chipFolderUrls[chipIdx];
                if (resolvedUrl) {
                  row["Carpeta Drive"] = resolvedUrl;
                  chipIdx++;
                }
              }
            }
          }

          console.log(
            `[Google Sheets] ✅ Se obtuvieron ${parsed.length} filas desde la hoja de cálculo.`
          );
          return parsed;
        }
      } else {
        console.warn(
          "[Google Sheets] ⚠️ La respuesta no contiene datos de portafolio esperados."
        );
      }
    } else {
      console.warn(
        `[Google Sheets] ⚠️ Error HTTP al consultar hoja: ${res.status} ${res.statusText}`
      );
    }
  } catch (err) {
    console.error(
      "[Google Sheets] ❌ Error de conexión al consultar hoja:",
      err
    );
  }

  return null;
}

/**
 * Obtiene todos los proyectos publicados del Portafolio Editorial en tiempo de compilación (SSG).
 *
 * - Ejecutado exclusivamente en el servidor durante `next build`.
 * - Filtra cualquier fila cuyo `Estado !== "Publicado"`.
 * - Descubre automáticamente todas las fotos dentro de cada `Carpeta Drive` pública.
 */
export async function getPortfolioProjects(options?: {
  onlyFeaturedInHome?: boolean;
}): Promise<PortfolioProject[]> {
  const remoteRows = await fetchRowsFromGoogleSheets();
  const sourceRows: RawPortfolioSheetRow[] =
    remoteRows && remoteRows.length > 0 ? remoteRows : EDITORIAL_FALLBACK_SEEDS;

  // Para cada fila publicada con Carpeta Drive, obtener automáticamente todas las fotos de la carpeta
  const folderFilesById: Record<string, DriveFolderFile[]> = {};
  const publishedRows = sourceRows.filter(
    (r) => r["Estado"]?.trim().toLowerCase() === "publicado"
  );

  await Promise.all(
    publishedRows.map(async (row) => {
      const folderId = extractDriveFolderId(row["Carpeta Drive"] || "");
      if (folderId && !folderFilesById[folderId]) {
        const files = await fetchDriveFolderImages(folderId);
        if (files.length > 0) {
          folderFilesById[folderId] = files;
          console.log(
            `[Google Drive] 📁 Carpeta ${folderId}: ${files.length} fotos encontradas (${files
              .map((f) => f.name)
              .join(", ")})`
          );
        }
      }
    })
  );

  const publishedProjects = normalizePortfolioRows(sourceRows, folderFilesById);

  if (options?.onlyFeaturedInHome) {
    return publishedProjects.filter((project) => project.featuredInHome);
  }

  return publishedProjects;
}
