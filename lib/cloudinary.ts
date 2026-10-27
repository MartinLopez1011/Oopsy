/* ============================================================
   OOPSY — Cloudinary Image Optimization & Security Service (lib/cloudinary.ts)

   Cumplimiento Ley N° 21.719 (Protección de Datos Personales) y Protección de Assets:
   1. Eliminación obligatoria de metadatos EXIF (`fl_strip_profile`) en TODAS las
      transformaciones para remover coordenadas GPS, números de serie de cámara y
      fechas de captura.
   2. Capa Pública (`/portafolio`, `/talentos`):
      - Transformación estándar contenida: `w_1200,q_auto,f_auto,fl_strip_profile`.
   3. Capa Privada B2B (`/casting/[token]` - Polaroids/Digitals):
      - Generación en el servidor de Next.js de **Cloudinary Signed URLs** (`s--...--`
        + token HMAC con `exp` de 15 a 30 minutos).
      - Marca de agua dinámica en tiempo real vía URL de Cloudinary:
        `l_text:Arial_24_bold:OOPSY%20CASTING%20CONFIDENCIAL,o_30,g_center,a_30`
        (personalizable con el nombre del cliente/agencia).
   ============================================================ */

import crypto from "node:crypto";

/** Cloud Name por defecto del CDN de Oopsy */
export const DEFAULT_CLOUDINARY_CLOUD_NAME = "kyzll4ja";

/** Transformación base obligatoria para el Portafolio Público y Book de Talentos */
export const PUBLIC_IMAGE_TRANSFORMATION =
  "w_1200,q_auto,f_auto,fl_strip_profile";

/** Texto de marca de agua por defecto para Polaroids confidenciales */
export const DEFAULT_WATERMARK_TEXT = "OOPSY CASTING CONFIDENCIAL";

/** Tiempo de expiración por defecto para URLs firmadas de Polaroids (en minutos) */
export const DEFAULT_SIGNED_URL_TTL_MINUTES = 20;

/** Límites permitidos para la ventana de expiración de URLs firmadas (15 a 30 min) */
const MIN_TTL_MINUTES = 15;
const MAX_TTL_MINUTES = 30;

/**
 * Obtiene el `cloud_name` activo desde las variables de entorno o el valor por defecto de Oopsy.
 */
export function getCloudinaryCloudName(): string {
  const envCloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim();
  if (
    envCloud &&
    envCloud !== "your-cloud-name" &&
    envCloud !== "undefined" &&
    envCloud !== "null"
  ) {
    return envCloud;
  }
  return DEFAULT_CLOUDINARY_CLOUD_NAME;
}

/**
 * Extrae el ID de archivo de Google Drive si la fuente proviene de un enlace de Drive.
 */
export function extractDriveFileIdFromSource(rawSource: string): string | null {
  if (!rawSource) return null;
  const trimmed = rawSource.trim();

  const fileMatch =
    trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    trimmed.match(
      /^https:\/\/lh\d*\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/i
    );

  return fileMatch?.[1] ?? null;
}

/**
 * Sanitiza un texto dinámico (ej. nombre del cliente + marca Oopsy) para ser
 * inyectado de forma segura dentro de la capa `l_text` de Cloudinary sin romper
 * la estructura de segmentos de la URL.
 */
export function sanitizeWatermarkText(rawText?: string): string {
  const baseText = (rawText || DEFAULT_WATERMARK_TEXT)
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    // Permitir solo caracteres alfanuméricos, espacios y guiones seguros para Cloudinary l_text
    .replace(/[^A-Z0-9 -]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return encodeURIComponent(baseText || DEFAULT_WATERMARK_TEXT);
}

/**
 * Construye el segmento de transformación de marca de agua dinámica en Cloudinary.
 *
 * Ejemplo generado por defecto:
 * `l_text:Arial_24_bold:OOPSY%20CASTING%20CONFIDENCIAL,o_30,g_center,a_30`
 */
export function buildCloudinaryWatermarkOverlay(customText?: string): string {
  const encodedText = sanitizeWatermarkText(customText);
  return `l_text:Arial_24_bold:${encodedText},o_30,g_center,a_30`;
}

/**
 * Normaliza una fuente de imagen (Public ID de Cloudinary, URL de Google Drive o URL externa)
 * en su tipo de entrega (`upload` vs `fetch`) y su identificador de recurso.
 */
function resolveCloudinaryTarget(rawSource: string): {
  deliveryType: "upload" | "fetch";
  targetPath: string;
} {
  const trimmed = rawSource.trim();

  // Caso 1: Archivo de Google Drive -> convertir al endpoint de imagen directa para Cloudinary Fetch
  const driveFileId = extractDriveFileIdFromSource(trimmed);
  if (driveFileId) {
    const googleDirectUrl = `https://lh3.googleusercontent.com/d/${driveFileId}=w1600`;
    return {
      deliveryType: "fetch",
      targetPath: encodeURIComponent(googleDirectUrl),
    };
  }

  // Caso 2: Public ID explícito de Cloudinary (`cloudinary:oopsy/...` o `cld:...`)
  if (/^(cloudinary:|cld:)/i.test(trimmed)) {
    const cleanPublicId = trimmed
      .replace(/^(cloudinary:|cld:)/i, "")
      .replace(/^\/+/, "");
    return {
      deliveryType: "upload",
      targetPath: cleanPublicId,
    };
  }

  // Caso 3: Ya es una URL de Cloudinary (`https://res.cloudinary.com/...`)
  if (trimmed.includes("res.cloudinary.com")) {
    const uploadMatch = trimmed.match(/\/image\/upload\/(?:[^/]+\/)*(.+)$/);
    if (uploadMatch?.[1]) {
      return {
        deliveryType: "upload",
        targetPath: uploadMatch[1],
      };
    }
    const fetchMatch = trimmed.match(/\/image\/fetch\/(?:[^/]+\/)*(https?:.+)$/);
    if (fetchMatch?.[1]) {
      return {
        deliveryType: "fetch",
        targetPath: encodeURIComponent(decodeURIComponent(fetchMatch[1])),
      };
    }
  }

  // Caso 4: Otra URL remota HTTP/HTTPS -> pasar por el proxy optimizador Cloudinary Fetch
  if (/^https?:\/\//i.test(trimmed)) {
    return {
      deliveryType: "fetch",
      targetPath: encodeURIComponent(trimmed),
    };
  }

  // Caso 5: Nombre de archivo o Public ID relativo dentro del folder de Cloudinary
  const folder =
    process.env.NEXT_PUBLIC_CLOUDINARY_FOLDER?.trim() || "oopsy/portfolio";
  const cleanRelative = trimmed.replace(/^\/+/, "");
  return {
    deliveryType: "upload",
    targetPath: cleanRelative.startsWith(folder)
      ? cleanRelative
      : `${folder}/${cleanRelative}`,
  };
}

/**
 * Construye una URL optimizada para la **Capa Pública** (`/portafolio`, `/talentos`).
 *
 * Garantías técnicas:
 * - Resolución contenida (`w_1200`) para evitar extracción de originales en alta resolución.
 * - Compresión y formato moderno automático (`q_auto,f_auto` -> WebP / AVIF).
 * - Eliminación total de metadatos EXIF (`fl_strip_profile`: GPS, cámara, fecha).
 */
export function buildPublicCloudinaryUrl(
  rawSource: string,
  options?: { width?: number }
): string {
  if (!rawSource || rawSource.startsWith("/")) {
    return rawSource;
  }

  const cloudName = getCloudinaryCloudName();
  const width = options?.width ?? 1200;
  const transformation = `w_${width},q_auto,f_auto,fl_strip_profile`;
  const { deliveryType, targetPath } = resolveCloudinaryTarget(rawSource);

  return `https://res.cloudinary.com/${cloudName}/image/${deliveryType}/${transformation}/${targetPath}`;
}

/**
 * Resultado de la firma criptográfica de una imagen privada (Polaroid/Digital)
 */
export interface SignedCloudinaryAssetResult {
  /** URL completa firmada con transformación de marca de agua, `fl_strip_profile` y expiración */
  url: string;
  /** Timestamp UNIX (en segundos) de expiración del enlace firmado */
  expiresAtUnix: number;
  /** Tiempo de vida aplicado en minutos (entre 15 y 30 min) */
  ttlMinutes: number;
  /** Firma corta de Cloudinary (`s--XXXXXXXX--`) */
  signatureComponent: string;
}

/**
 * Genera en el servidor de Next.js una **Cloudinary Signed URL** de corta duración
 * (15 a 30 minutos) para proteger fotografías sensibles (*Polaroids/Digitals*) en
 * paquetes de casting privados (`/casting/[token]`).
 *
 * Transformaciones de seguridad aplicadas en cadena:
 * 1. `w_1200,q_auto,f_auto,fl_strip_profile`: Elimina EXIF/GPS y optimiza entrega.
 * 2. `l_text:Arial_24_bold:OOPSY%20CASTING%20CONFIDENCIAL,o_30,g_center,a_30`:
 *    Incrusta marca de agua diagonal semitransparente directamente en los píxeles
 *    servidos por el CDN de Cloudinary.
 * 3. `s--<base64url_sha1>--` + `?__cld_token__=exp=<unix>~hmac=<sha256>`:
 *    Firma criptográfica generada con `CLOUDINARY_API_SECRET` en el backend (jamás expuesta al cliente).
 */
export function generateSignedPolaroidUrl(
  rawSource: string,
  options?: {
    clientName?: string;
    watermarkText?: string;
    ttlMinutes?: number;
    width?: number;
  }
): SignedCloudinaryAssetResult {
  const cloudName = getCloudinaryCloudName();
  const apiSecret =
    process.env.CLOUDINARY_API_SECRET?.trim() ||
    "oopsy-casting-private-signing-secret-21719";

  // Acotar estrictamente el tiempo de expiración al rango de seguridad requerido (15 a 30 min)
  const requestedTtl = options?.ttlMinutes ?? DEFAULT_SIGNED_URL_TTL_MINUTES;
  const ttlMinutes = Math.min(
    MAX_TTL_MINUTES,
    Math.max(MIN_TTL_MINUTES, requestedTtl)
  );

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAtUnix = nowSeconds + ttlMinutes * 60;

  const width = options?.width ?? 1200;
  const baseTransformation = `w_${width},q_auto,f_auto,fl_strip_profile`;

  // Construir el texto de marca de agua (por defecto "OOPSY CASTING CONFIDENCIAL" o con el cliente si se especifica)
  const watermarkLabel =
    options?.watermarkText || DEFAULT_WATERMARK_TEXT;
  const watermarkTransformation =
    buildCloudinaryWatermarkOverlay(watermarkLabel);

  const { deliveryType, targetPath } = resolveCloudinaryTarget(rawSource);
  const chainedTransformations = `${baseTransformation}/${watermarkTransformation}`;

  // Especificación oficial de Cloudinary URL Signature:
  // Primeros 8 caracteres en Base64 URL-safe del hash SHA-1 de `<transformation>/<public_id><api_secret>`
  const stringToSign = `${chainedTransformations}/${targetPath}${apiSecret}`;
  const sha1Base64Url = crypto
    .createHash("sha1")
    .update(stringToSign)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .substring(0, 8);

  const signatureComponent = `s--${sha1Base64Url}--`;

  // Token HMAC-SHA256 con ventana de expiración explícita (`exp=<unix_timestamp>`)
  const tokenPayload = `exp=${expiresAtUnix}~acl=/${cloudName}/image/${deliveryType}/${signatureComponent}/${chainedTransformations}/*`;
  const hmacHex = crypto
    .createHmac("sha256", apiSecret)
    .update(tokenPayload)
    .digest("hex");

  const signedUrl = `https://res.cloudinary.com/${cloudName}/image/${deliveryType}/${signatureComponent}/${chainedTransformations}/${targetPath}?__cld_token__=exp=${expiresAtUnix}~hmac=${hmacHex}`;

  return {
    url: signedUrl,
    expiresAtUnix,
    ttlMinutes,
    signatureComponent,
  };
}
