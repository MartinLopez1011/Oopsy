/* ============================================================
   OOPSY — Decoupled Data Repository (lib/repository.ts)

   Capa de abstracción de datos (Repository Pattern) que desacopla la UI
   de la fuente subyacente (Google Sheets API v4 / CSV / CMS futuro) y
   ejecuta las garantías de privacidad de la Ley N° 21.719 en el servidor:

   1. `getPublicModels()`:
      - Filtra estrictamente `status === "Publicado"`.
      - Proyecta (allowlist) únicamente campos públicos (`id`, `name`, `category`,
        `height`, `coverImage`, `bookGallery`, `credits`).
      - JAMÁS incluye `bust`, `waist`, `hips`, `shoes`, `polaroids_folder_url`
        ni galerías de Polaroids/Digitals.
      - Procesa todas las imágenes públicas con `buildPublicCloudinaryUrl`
        (`w_1200,q_auto,f_auto,fl_strip_profile`).

   2. `getCastingPackage(token, options)`:
      - Valida existencia del token, vigencia temporal (`expires_at`) y
        código PIN opcional de 4 dígitos (comparación en tiempo constante
        `crypto.timingSafeEqual`).
      - Si el paquete requiere PIN y aún no ha sido validado, NO expone las
        fichas de las modelos ni firma URLs de Polaroids.
      - Si está autorizado y vigente, firma en caliente las URLs de las
        Polaroids mediante `generateSignedPolaroidUrl` con expiración de 20 min
        (rango 15–30 min), eliminación EXIF (`fl_strip_profile`) y marca de agua
        dinámica en tiempo real (`OOPSY CASTING CONFIDENCIAL`).
   ============================================================ */

import crypto from "node:crypto";
import type { EditorialAspectRatio } from "@/types/portfolio";
import type {
  FullTalentCastingProfile,
  PublicTalentProfile,
  RawTalentSheetRow,
  TalentCategory,
  TalentMediaAsset,
} from "@/types/talent";
import type {
  CastingPackageRecord,
  CastingPackageResolution,
  RawCastingPackageSheetRow,
} from "@/types/casting";
import {
  buildPublicCloudinaryUrl,
  DEFAULT_SIGNED_URL_TTL_MINUTES,
  DEFAULT_WATERMARK_TEXT,
  generateSignedPolaroidUrl,
} from "@/lib/cloudinary";
import {
  createEditorialBlurDataURL,
  extractDriveFolderId,
  fetchDriveFolderImages,
} from "@/lib/portfolio";

/** Categorías válidas de talentos en Oopsy */
export const VALID_TALENT_CATEGORIES: readonly TalentCategory[] = [
  "Editorial & Couture",
  "Runway / Pasarela",
  "Commercial & Rostro",
  "New Faces",
];

interface InternalTalentSeed extends RawTalentSheetRow {
  _aspectRatio: EditorialAspectRatio;
  _blurHex: [string, string];
  _bookImages: Array<{
    src: string;
    alt: string;
    caption: string;
    aspectRatio: EditorialAspectRatio;
    width: number;
    height: number;
  }>;
  _polaroidImages: Array<{
    src: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
  }>;
}

/* ============================================================
   SEMILLAS DE TALENTOS & PACKAGES DE CASTING (Fallback / Demo)
   Se utilizan cuando Google Sheets no tiene configuradas las pestañas
   remotas de Talentos/Packages, permitiendo probar tanto la capa
   pública como los flujos B2B privados (`/casting/falabella-ss27-9x2`,
   PIN `2027` en `/casting/vogue-couture-pin4`, y enlace caducado en
   `/casting/campana-aw25-exp`).
   ============================================================ */

const TALENT_SEEDS: InternalTalentSeed[] = [
  {
    id: "TAL-001",
    name: "Antonia Subercaseaux",
    category: "Editorial & Couture",
    height: "1.79 m",
    shoes: "39 EU",
    bust: "81 cm",
    waist: "59 cm",
    hips: "88 cm",
    book_folder_url: "https://drive.google.com/drive/folders/1OopsyBookTal001",
    polaroids_folder_url:
      "https://drive.google.com/drive/folders/1OopsyPolaTal001",
    cover_image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=85",
    status: "Publicado",
    runway_video_url:
      "https://assets.mixkit.co/videos/preview/mixkit-fashion-model-posing-in-neon-light-39877-large.mp4",
    credits_photography: "Valentina Moraga",
    credits_styling: "Sofía Larraín · Atelier Kósmos",
    credits_campaigns: "L'Officiel Sudamérica · Silencio Mineral AW26",
    _aspectRatio: "3:4",
    _blurHex: ["#e8e0d5", "#c8beb2"],
    _bookImages: [
      {
        src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=85",
        alt: "Antonia Subercaseaux — Portada Book Editorial Oopsy",
        caption: "Editorial L'Officiel — Retrato en luz cenital difusa.",
        aspectRatio: "3:4",
        width: 1200,
        height: 1600,
      },
      {
        src: "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1400&q=85",
        alt: "Antonia Subercaseaux — Sastrería escultural AW26",
        caption: "Campaña Silencio Mineral — Abrigo en lana merino.",
        aspectRatio: "3:4",
        width: 1200,
        height: 1600,
      },
      {
        src: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1400&q=85",
        alt: "Antonia Subercaseaux — Silueta completa en locación brutalista",
        caption: "Lookbook — Arquitectura en hormigón y caída fluida.",
        aspectRatio: "4:5",
        width: 1200,
        height: 1500,
      },
    ],
    _polaroidImages: [
      {
        src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=85",
        alt: "Antonia Subercaseaux — Polaroid Frontal Luz Natural",
        caption: "Digital 01 · Rostro frontal sin maquillaje (Luz de día)",
        width: 1200,
        height: 1600,
      },
      {
        src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=1200&q=85",
        alt: "Antonia Subercaseaux — Polaroid Perfil Tres Cuartos",
        caption: "Digital 02 · Perfil 3/4 estructura ósea al natural",
        width: 1200,
        height: 1600,
      },
      {
        src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85",
        alt: "Antonia Subercaseaux — Polaroid Plano Entero",
        caption: "Digital 03 · Plano entero proporción en estudio",
        width: 1200,
        height: 1600,
      },
    ],
  },
  {
    id: "TAL-002",
    name: "Renata Valdivieso",
    category: "Runway / Pasarela",
    height: "1.81 m",
    shoes: "40 EU",
    bust: "80 cm",
    waist: "58 cm",
    hips: "87 cm",
    book_folder_url: "https://drive.google.com/drive/folders/1OopsyBookTal002",
    polaroids_folder_url:
      "https://drive.google.com/drive/folders/1OopsyPolaTal002",
    cover_image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=85",
    status: "Publicado",
    runway_video_url:
      "https://assets.mixkit.co/videos/preview/mixkit-woman-modeling-in-a-photo-shoot-34484-large.mp4",
    credits_photography: "Matías Errázuriz",
    credits_styling: "Clara Montes · Maison Velours",
    credits_campaigns: "Nocturna Runway Show · Santiago Fashion Week",
    _aspectRatio: "4:5",
    _blurHex: ["#302e2c", "#524e4a"],
    _bookImages: [
      {
        src: "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1400&q=85",
        alt: "Renata Valdivieso — Apertura de pasarela Nocturna Runway",
        caption: "Runway — Sastrería deconstruida en tonos tierra.",
        aspectRatio: "3:4",
        width: 1200,
        height: 1600,
      },
      {
        src: "https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&w=1400&q=85",
        alt: "Renata Valdivieso — Salida principal Maison Velours",
        caption: "Pasarela — Look de cierre colección Alta Costura.",
        aspectRatio: "3:4",
        width: 1200,
        height: 1600,
      },
    ],
    _polaroidImages: [
      {
        src: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85",
        alt: "Renata Valdivieso — Polaroid Frontal",
        caption: "Digital 01 · Frontal estudio sin retoque",
        width: 1200,
        height: 1600,
      },
      {
        src: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1200&q=85",
        alt: "Renata Valdivieso — Polaroid Medio Cuerpo",
        caption: "Digital 02 · Medio cuerpo luz continua",
        width: 1200,
        height: 1600,
      },
    ],
  },
  {
    id: "TAL-003",
    name: "Gaspar Fontaine",
    category: "Editorial & Couture",
    height: "1.88 m",
    shoes: "43 EU",
    bust: "96 cm",
    waist: "75 cm",
    hips: "94 cm",
    book_folder_url: "https://drive.google.com/drive/folders/1OopsyBookTal003",
    polaroids_folder_url:
      "https://drive.google.com/drive/folders/1OopsyPolaTal003",
    cover_image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1400&q=85",
    status: "Publicado",
    runway_video_url:
      "https://assets.mixkit.co/videos/preview/mixkit-man-posing-for-a-photo-shoot-34487-large.mp4",
    credits_photography: "Diego Santelices",
    credits_styling: "Ignacio Puga · Nómada Studio",
    credits_campaigns: "Archivo Brutalista · GQ Cono Sur",
    _aspectRatio: "3:4",
    _blurHex: ["#d8d2c9", "#8a8580"],
    _bookImages: [
      {
        src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1400&q=85",
        alt: "Gaspar Fontaine — Retrato editorial monocromático",
        caption: "Editorial — Primer plano en iluminación dura de estudio.",
        aspectRatio: "3:4",
        width: 1200,
        height: 1600,
      },
      {
        src: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=85",
        alt: "Gaspar Fontaine — Sastrería contemporánea",
        caption: "Campaña Nómada Studio — Lino pesado y gabardina.",
        aspectRatio: "4:5",
        width: 1200,
        height: 1500,
      },
    ],
    _polaroidImages: [
      {
        src: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=85",
        alt: "Gaspar Fontaine — Polaroid Frontal",
        caption: "Digital 01 · Rostro frontal luz natural",
        width: 1200,
        height: 1600,
      },
      {
        src: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=1200&q=85",
        alt: "Gaspar Fontaine — Polaroid Perfil",
        caption: "Digital 02 · Perfil tres cuartos sin estilismo",
        width: 1200,
        height: 1600,
      },
    ],
  },
  {
    id: "TAL-004",
    name: "Mila Huidobro",
    category: "Commercial & Rostro",
    height: "1.75 m",
    shoes: "38 EU",
    bust: "83 cm",
    waist: "61 cm",
    hips: "90 cm",
    book_folder_url: "https://drive.google.com/drive/folders/1OopsyBookTal004",
    polaroids_folder_url:
      "https://drive.google.com/drive/folders/1OopsyPolaTal004",
    cover_image:
      "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1400&q=85",
    status: "Publicado",
    credits_photography: "Antonia Valdés",
    credits_styling: "Oopsy Creative Lab",
    credits_campaigns: "Botánica de Cristal SS27 · Cecilie & Co.",
    _aspectRatio: "4:5",
    _blurHex: ["#f7c4db", "#f4ecdf"],
    _bookImages: [
      {
        src: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=1400&q=85",
        alt: "Mila Huidobro — Campaña Beauty Botánica de Cristal",
        caption: "Beauty Editorial — Piel orgánica e iluminación suave.",
        aspectRatio: "4:5",
        width: 1200,
        height: 1500,
      },
      {
        src: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1400&q=85",
        alt: "Mila Huidobro — Secuencia en invernadero",
        caption: "Campaña SS27 — Organza translúcida en exterior.",
        aspectRatio: "16:10",
        width: 1200,
        height: 750,
      },
    ],
    _polaroidImages: [
      {
        src: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85",
        alt: "Mila Huidobro — Polaroid Beauty Natural",
        caption: "Digital 01 · Beauty clean look en estudio",
        width: 1200,
        height: 1600,
      },
    ],
  },
  {
    id: "TAL-005",
    name: "Eloísa Mackenna",
    category: "New Faces",
    height: "1.77 m",
    shoes: "39 EU",
    bust: "79 cm",
    waist: "58 cm",
    hips: "86 cm",
    book_folder_url: "https://drive.google.com/drive/folders/1OopsyBookTal005",
    polaroids_folder_url:
      "https://drive.google.com/drive/folders/1OopsyPolaTal005",
    cover_image:
      "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1400&q=85",
    status: "Publicado",
    credits_photography: "Estudio Oopsy",
    credits_styling: "Fernanda Lira",
    credits_campaigns: "New Faces SS27 · Debut Editorial",
    _aspectRatio: "3:4",
    _blurHex: ["#d4eeb3", "#f4ecdf"],
    _bookImages: [
      {
        src: "https://images.unsplash.com/photo-1502716119720-b23a93e5fe1b?auto=format&fit=crop&w=1400&q=85",
        alt: "Eloísa Mackenna — Presentación New Faces Oopsy",
        caption: "Test Shoot — Silueta completa a contraluz.",
        aspectRatio: "3:4",
        width: 1200,
        height: 1600,
      },
    ],
    _polaroidImages: [
      {
        src: "https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?auto=format&fit=crop&w=1200&q=85",
        alt: "Eloísa Mackenna — Polaroid Frontal New Faces",
        caption: "Digital 01 · Registro inicial de agencia",
        width: 1200,
        height: 1600,
      },
    ],
  },
  {
    id: "TAL-006",
    name: "Clemente Zañartu",
    category: "Runway / Pasarela",
    height: "1.86 m",
    shoes: "42.5 EU",
    bust: "94 cm",
    waist: "73 cm",
    hips: "92 cm",
    book_folder_url: "https://drive.google.com/drive/folders/1OopsyBookTal006",
    polaroids_folder_url:
      "https://drive.google.com/drive/folders/1OopsyPolaTal006",
    cover_image:
      "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1400&q=85",
    status: "Publicado",
    credits_photography: "Gaspar Huidobro",
    credits_styling: "Camila Ríos",
    credits_campaigns: "Crónica de un Interludio · Pasarela Invernal",
    _aspectRatio: "3:4",
    _blurHex: ["#8cd3db", "#f4ecdf"],
    _bookImages: [
      {
        src: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc?auto=format&fit=crop&w=1400&q=85",
        alt: "Clemente Zañartu — Editorial en luz de tarde",
        caption: "Editorial — Contraluz cálido sobre tejidos naturales.",
        aspectRatio: "3:4",
        width: 1200,
        height: 1600,
      },
    ],
    _polaroidImages: [
      {
        src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=1200&q=85",
        alt: "Clemente Zañartu — Polaroid Estudio",
        caption: "Digital 01 · Polaroid de control pre-fitting",
        width: 1200,
        height: 1600,
      },
    ],
  },
  {
    id: "TAL-007",
    name: "Isidora Goycolea (En Scouting)",
    category: "New Faces",
    height: "1.76 m",
    shoes: "38 EU",
    bust: "80 cm",
    waist: "60 cm",
    hips: "88 cm",
    book_folder_url: "https://drive.google.com/drive/folders/1OopsyBookTal007",
    polaroids_folder_url:
      "https://drive.google.com/drive/folders/1OopsyPolaTal007",
    cover_image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=85",
    status: "Borrador", // <-- REGLA CRÍTICA: Jamás se expone en getPublicModels()
    _aspectRatio: "3:4",
    _blurHex: ["#f4ecdf", "#e8e5e0"],
    _bookImages: [],
    _polaroidImages: [],
  },
];

const CASTING_PACKAGE_SEEDS: RawCastingPackageSheetRow[] = [
  {
    token: "falabella-ss27-9x2",
    client_name: "Falabella — Dirección de Casting Campaña SS27",
    model_ids: ["TAL-001", "TAL-002", "TAL-003", "TAL-004"],
    show_measurements: true,
    expires_at: "2027-12-31T23:59:59.000Z",
    casting_note:
      "Selección curada de talentos Oopsy para campaña principal Primavera/Verano 27 y lookbook digital. Incluye medidas anatómicas verificadas en agencia, video de pasarela y Polaroids/Digitals al natural.",
  },
  {
    token: "vogue-couture-pin4",
    client_name: "Vogue Latinoamérica — Producción Alta Costura",
    model_ids: ["TAL-001", "TAL-002", "TAL-005"],
    show_measurements: true,
    expires_at: "2027-11-30T23:59:59.000Z",
    pin_code: "2027",
    casting_note:
      "Package confidencial protegido con PIN de 4 dígitos para revisión exclusiva de dirección editorial.",
  },
  {
    token: "paris-lookbook-nomin",
    client_name: "París — Lookbook Editorial (Modalidad Sin Medidas)",
    model_ids: ["TAL-001", "TAL-004", "TAL-006"],
    show_measurements: false,
    expires_at: "2027-10-15T23:59:59.000Z",
    casting_note:
      "Pre-selección visual de rostros y actitud frente a cámara. La visualización de medidas anatómicas se encuentra deshabilitada en este paquete por configuración de privacidad.",
  },
  {
    token: "campana-aw25-exp",
    client_name: "Atelier Kósmos — Casting Invernal AW25",
    model_ids: ["TAL-001", "TAL-002"],
    show_measurements: true,
    expires_at: "2025-05-15T23:59:59.000Z",
    casting_note: "Enlace histórico vencido para prueba de caducidad.",
  },
];

/* ============================================================
   UTILITARIOS DE PARSEO Y NORMALIZACIÓN DE GOOGLE SHEETS
   ============================================================ */

function normalizeTalentCategory(raw: string): TalentCategory {
  const cleaned = raw.trim();
  const exact = VALID_TALENT_CATEGORIES.find(
    (c) => c.toLowerCase() === cleaned.toLowerCase()
  );
  if (exact) return exact;

  if (/runway|pasarela|desfile/i.test(cleaned)) return "Runway / Pasarela";
  if (/commercial|comercial|rostro|beauty/i.test(cleaned))
    return "Commercial & Rostro";
  if (/new|scouting|debut/i.test(cleaned)) return "New Faces";
  return "Editorial & Couture";
}

function slugifyTalent(id: string, name: string): string {
  return `${id}-${name}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Parser RFC 4180 genérico para convertir CSV de Google Sheets en registros clave-valor
 */
function parseGenericCsvToRecords(csvText: string): Array<Record<string, string>> {
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
    } else if (char === '"') {
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

  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  if (rows.length < 2) return [];

  const headers = rows[0].map((h) =>
    h
      .replace(/^\uFEFF/, "")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
  );

  return rows
    .slice(1)
    .filter((r) => r.some((cell) => cell.length > 0))
    .map((cells) => {
      const record: Record<string, string> = {};
      headers.forEach((h, idx) => {
        if (h) record[h] = (cells[idx] ?? "").trim();
      });
      return record;
    });
}

/**
 * Consulta filas remotas de Talentos desde Google Sheets si `GOOGLE_SHEETS_TALENTS_CSV_URL` está configurada.
 */
async function fetchRemoteTalentRows(): Promise<RawTalentSheetRow[] | null> {
  const csvUrl = process.env.GOOGLE_SHEETS_TALENTS_CSV_URL?.trim();
  if (!csvUrl || csvUrl === "undefined" || csvUrl.includes("your-")) {
    return null;
  }

  try {
    const res = await fetch(csvUrl, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.trim().startsWith("<!DOCTYPE")) return null;

    const rawRecords = parseGenericCsvToRecords(text);
    if (rawRecords.length === 0) return null;

    return rawRecords.map((rec, idx) => ({
      id: rec["id"] || rec["id talento"] || `TAL-${String(idx + 1).padStart(3, "0")}`,
      name: rec["name"] || rec["nombre"] || "Talento Oopsy",
      category: rec["category"] || rec["categoria"] || "Editorial & Couture",
      height: rec["height"] || rec["altura"] || rec["estatura"] || "",
      shoes: rec["shoes"] || rec["calzado"] || "",
      bust: rec["bust"] || rec["busto"] || "",
      waist: rec["waist"] || rec["cintura"] || "",
      hips: rec["hips"] || rec["cadera"] || "",
      book_folder_url: rec["book_folder_url"] || rec["carpeta book"] || "",
      polaroids_folder_url:
        rec["polaroids_folder_url"] || rec["carpeta polaroids"] || "",
      cover_image: rec["cover_image"] || rec["imagen de portada"] || "",
      status: rec["status"] || rec["estado"] || "Borrador",
      runway_video_url: rec["runway_video_url"] || rec["video pasarela"] || undefined,
      credits_photography:
        rec["credits_photography"] || rec["creditos fotografia"] || undefined,
      credits_styling:
        rec["credits_styling"] || rec["creditos estilismo"] || undefined,
      credits_campaigns:
        rec["credits_campaigns"] || rec["campanas"] || undefined,
    }));
  } catch {
    return null;
  }
}

/**
 * Consulta filas remotas de Packages de Casting desde Google Sheets si `GOOGLE_SHEETS_CASTING_CSV_URL` está configurada.
 */
async function fetchRemoteCastingPackageRows(): Promise<
  RawCastingPackageSheetRow[] | null
> {
  const csvUrl = process.env.GOOGLE_SHEETS_CASTING_CSV_URL?.trim();
  if (!csvUrl || csvUrl === "undefined" || csvUrl.includes("your-")) {
    return null;
  }

  try {
    const res = await fetch(csvUrl, { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    if (text.trim().startsWith("<!DOCTYPE")) return null;

    const rawRecords = parseGenericCsvToRecords(text);
    if (rawRecords.length === 0) return null;

    return rawRecords.map((rec) => ({
      token: rec["token"] || rec["slug"] || "",
      client_name: rec["client_name"] || rec["cliente"] || "Cliente Casting",
      model_ids: rec["model_ids"] || rec["modelos"] || "",
      show_measurements:
        rec["show_measurements"] || rec["mostrar medidas"] || "true",
      expires_at: rec["expires_at"] || rec["expiracion"] || "",
      pin_code: rec["pin_code"] || rec["pin"] || undefined,
      casting_note: rec["casting_note"] || rec["nota"] || undefined,
    }));
  } catch {
    return null;
  }
}

/**
 * Transforma un registro crudo de talento en un `PublicTalentProfile`,
 * aplicando un filtro estricto a nivel de campo (Field-Level Privacy Filtering)
 * para garantizar que NINGÚN dato sensible (busto, cintura, cadera, calzado,
 * polaroids_folder_url) exista en el objeto retornado.
 */
async function mapRowToPublicTalentProfile(
  row: RawTalentSheetRow,
  index: number
): Promise<PublicTalentProfile> {
  const seedMatch =
    TALENT_SEEDS.find((s) => s.id.toLowerCase() === row.id.toLowerCase()) ||
    TALENT_SEEDS[index % (TALENT_SEEDS.length - 1)];

  const blurColors = seedMatch?._blurHex || ["#f4ecdf", "#e8e5e0"];
  const blurDataURL = createEditorialBlurDataURL(blurColors[0], blurColors[1]);
  const aspectRatio: EditorialAspectRatio = seedMatch?._aspectRatio || "3:4";

  // Optimizar imagen de portada con eliminación de metadatos EXIF (`fl_strip_profile`) y `w_1200,q_auto,f_auto`
  const rawCover = row.cover_image?.trim() || seedMatch.cover_image;
  const coverImage = buildPublicCloudinaryUrl(rawCover, { width: 1200 });

  // Si hay una carpeta Drive real configurada para el Book público, descubrir sus imágenes;
  // en caso contrario usar la galería del Book curado.
  const bookFolderId = extractDriveFolderId(row.book_folder_url || "");
  const discoveredBookFiles =
    bookFolderId && !bookFolderId.startsWith("1Oopsy")
      ? await fetchDriveFolderImages(bookFolderId)
      : [];

  let bookGallery: TalentMediaAsset[] = [];

  if (discoveredBookFiles.length > 0) {
    bookGallery = discoveredBookFiles.map((file, idx) => ({
      id: `${row.id}-book-${idx + 1}`,
      src: buildPublicCloudinaryUrl(file.cdnUrl, { width: 1200 }),
      alt: `${row.name} — Book Editorial (${idx + 1})`,
      width: 1200,
      height: 1600,
      aspectRatio: "3:4",
      caption: `${row.name} · Portfolio Book`,
      blurDataURL,
    }));
  } else if (seedMatch?._bookImages && seedMatch._bookImages.length > 0) {
    bookGallery = seedMatch._bookImages.map((img, idx) => ({
      id: `${row.id}-book-${idx + 1}`,
      src: buildPublicCloudinaryUrl(img.src, { width: 1200 }),
      alt: img.alt,
      width: img.width,
      height: img.height,
      aspectRatio: img.aspectRatio,
      caption: img.caption,
      blurDataURL,
    }));
  } else {
    bookGallery = [
      {
        id: `${row.id}-book-1`,
        src: coverImage,
        alt: `${row.name} — Book Editorial`,
        width: 1200,
        height: 1600,
        aspectRatio: "3:4",
        caption: `${row.name} · Book Oficial Oopsy`,
        blurDataURL,
      },
    ];
  }

  // SANITIZACIÓN ESTRICTA LEY N° 21.719:
  // Construimos un nuevo objeto literal únicamente con las propiedades públicas autorizadas.
  return {
    id: row.id.trim(),
    slug: slugifyTalent(row.id, row.name),
    name: row.name.trim(),
    category: normalizeTalentCategory(row.category),
    height: row.height.trim(),
    coverImage,
    blurDataURL,
    aspectRatio,
    bookGallery,
    credits: {
      photography: row.credits_photography?.trim() || undefined,
      styling: row.credits_styling?.trim() || undefined,
      recentCampaigns: row.credits_campaigns?.trim() || undefined,
    },
    status: "Publicado",
  };
}

/**
 * Comparación criptográfica en tiempo constante para validación de PIN de 4 dígitos,
 * previniendo ataques de temporización (Timing Side-Channel Attacks).
 */
function verifyPinConstantTime(expectedPin: string, providedPin: string): boolean {
  const cleanExpected = expectedPin.trim();
  const cleanProvided = providedPin.trim();

  if (!cleanExpected || cleanExpected.length !== cleanProvided.length) {
    return false;
  }

  const bufExpected = Buffer.from(cleanExpected, "utf-8");
  const bufProvided = Buffer.from(cleanProvided, "utf-8");
  return crypto.timingSafeEqual(bufExpected, bufProvided);
}

/**
 * Normaliza una fila cruda de Package de Casting en `CastingPackageRecord`.
 */
function normalizeCastingPackageRow(
  raw: RawCastingPackageSheetRow
): CastingPackageRecord {
  const modelIds = Array.isArray(raw.model_ids)
    ? raw.model_ids.map((id) => id.trim()).filter(Boolean)
    : String(raw.model_ids || "")
        .split(/[,;|]+/)
        .map((id) => id.trim())
        .filter(Boolean);

  const rawShow = raw.show_measurements;
  const showMeasurements =
    typeof rawShow === "boolean"
      ? rawShow
      : !/^(false|no|0)$/i.test(String(rawShow).trim());

  const cleanPin = raw.pin_code?.trim();

  return {
    token: raw.token.trim().toLowerCase(),
    clientName: raw.client_name.trim(),
    modelIds,
    showMeasurements,
    expiresAt: raw.expires_at.trim(),
    pinCode: cleanPin && cleanPin.length > 0 ? cleanPin : undefined,
    castingNote: raw.casting_note?.trim() || undefined,
  };
}

/* ============================================================
   API PÚBLICA DEL REPOSITORIO
   ============================================================ */

/**
 * `getPublicModels()`
 *
 * Retorna exclusivamente la lista de talentos con `status === 'Publicado'`
 * y filtra a nivel de campo cualquier dato sensible (busto, cintura, cadera,
 * calzado, peso, contacto o Polaroids).
 */
export async function getPublicModels(): Promise<PublicTalentProfile[]> {
  const remoteRows = await fetchRemoteTalentRows();
  const allRows: RawTalentSheetRow[] =
    remoteRows && remoteRows.length > 0 ? remoteRows : TALENT_SEEDS;

  // Filtrar estrictamente: solo talentos con status === 'Publicado'
  const publishedRows = allRows.filter(
    (row) => row.status?.trim().toLowerCase() === "publicado"
  );

  const profiles = await Promise.all(
    publishedRows.map((row, index) => mapRowToPublicTalentProfile(row, index))
  );

  return profiles;
}

/**
 * `getCastingPackage(token, options)`
 *
 * Valida un token criptográfico de paquete de casting B2B (`/casting/[token]`),
 * comprueba su fecha de expiración (`expires_at`), verifica el PIN opcional de 4 dígitos
 * en el servidor y, solo si el acceso es válido, firma en caliente las URLs de las
 * Polaroids con el motor criptográfico de Cloudinary (`generateSignedPolaroidUrl`).
 */
export async function getCastingPackage(
  token: string,
  options?: { providedPin?: string }
): Promise<CastingPackageResolution> {
  const cleanToken = decodeURIComponent(token || "")
    .trim()
    .toLowerCase();

  if (!cleanToken) {
    return { status: "not_found", token: cleanToken };
  }

  const remotePackages = await fetchRemoteCastingPackageRows();
  const packageSource =
    remotePackages && remotePackages.length > 0
      ? remotePackages
      : CASTING_PACKAGE_SEEDS;

  const matchedRaw = packageSource.find(
    (pkg) => pkg.token.trim().toLowerCase() === cleanToken
  );

  if (!matchedRaw) {
    return { status: "not_found", token: cleanToken };
  }

  const pkg = normalizeCastingPackageRow(matchedRaw);

  // 1. Verificación estricta de vigencia temporal (`expires_at`)
  const expiresTimestamp = Date.parse(pkg.expiresAt);
  const nowTimestamp = Date.now();

  if (Number.isNaN(expiresTimestamp) || nowTimestamp > expiresTimestamp) {
    return {
      status: "expired",
      token: pkg.token,
      clientName: pkg.clientName,
      expiresAt: pkg.expiresAt,
    };
  }

  // 2. Verificación de código PIN de 4 dígitos (si el package lo define)
  if (pkg.pinCode) {
    const providedPin = options?.providedPin?.trim();

    if (!providedPin) {
      return {
        status: "requires_pin",
        token: pkg.token,
        clientName: pkg.clientName,
        expiresAt: pkg.expiresAt,
        castingNote: pkg.castingNote,
        totalTalentsCount: pkg.modelIds.length,
      };
    }

    const isPinValid = verifyPinConstantTime(pkg.pinCode, providedPin);
    if (!isPinValid) {
      return {
        status: "requires_pin",
        token: pkg.token,
        clientName: pkg.clientName,
        expiresAt: pkg.expiresAt,
        castingNote: pkg.castingNote,
        totalTalentsCount: pkg.modelIds.length,
        pinError:
          "El código PIN ingresado es incorrecto. Verifica las credenciales enviadas por tu Booker en Oopsy.",
      };
    }
  }

  // 3. Resolver fichas completas de las modelos asignadas al Package y firmar Polaroids en caliente
  const remoteTalents = await fetchRemoteTalentRows();
  const talentSource: RawTalentSheetRow[] =
    remoteTalents && remoteTalents.length > 0 ? remoteTalents : TALENT_SEEDS;

  const assignedRows = pkg.modelIds
    .map((targetId) =>
      talentSource.find(
        (t) => t.id.trim().toLowerCase() === targetId.toLowerCase()
      )
    )
    .filter((t): t is RawTalentSheetRow => Boolean(t));

  const ttlMinutes = DEFAULT_SIGNED_URL_TTL_MINUTES;

  const fullProfiles: FullTalentCastingProfile[] = await Promise.all(
    assignedRows.map(async (row, index) => {
      const publicBase = await mapRowToPublicTalentProfile(row, index);
      const seedMatch = TALENT_SEEDS.find(
        (s) => s.id.toLowerCase() === row.id.toLowerCase()
      );

      // Si existe una carpeta Drive real de Polaroids, descubrir sus archivos;
      // de lo contrario usar las Polaroids de la semilla correspondiente.
      const polaroidFolderId = extractDriveFolderId(
        row.polaroids_folder_url || ""
      );
      const discoveredPolaroids =
        polaroidFolderId && !polaroidFolderId.startsWith("1Oopsy")
          ? await fetchDriveFolderImages(polaroidFolderId)
          : [];

      const rawPolaroidItems =
        discoveredPolaroids.length > 0
          ? discoveredPolaroids.map((file, idx) => ({
              src: file.cdnUrl,
              alt: `${row.name} — Polaroid Confidencial ${idx + 1}`,
              caption: `Digital ${String(idx + 1).padStart(2, "0")} · Registro natural sin retoque`,
              width: 1200,
              height: 1600,
            }))
          : seedMatch?._polaroidImages || [
              {
                src: row.cover_image,
                alt: `${row.name} — Polaroid Confidencial`,
                caption: "Digital 01 · Toma al natural de agencia",
                width: 1200,
                height: 1600,
              },
            ];

      // Firmar en caliente cada Polaroid con Cloudinary Signed URL (TTL 20 min) + Marca de agua dinámica + fl_strip_profile
      const polaroidsGallery: TalentMediaAsset[] = rawPolaroidItems.map(
        (pola, pIdx) => {
          const signed = generateSignedPolaroidUrl(pola.src, {
            clientName: pkg.clientName,
            watermarkText: DEFAULT_WATERMARK_TEXT,
            ttlMinutes,
            width: 1200,
          });

          return {
            id: `${row.id}-polaroid-${pIdx + 1}`,
            src: signed.url,
            alt: pola.alt,
            width: pola.width,
            height: pola.height,
            aspectRatio: "3:4",
            caption: pola.caption,
            blurDataURL: publicBase.blurDataURL,
            isSignedPrivate: true,
            expiresAtUnix: signed.expiresAtUnix,
          };
        }
      );

      return {
        ...publicBase,
        measurements: pkg.showMeasurements
          ? {
              height: row.height.trim() || "—",
              bust: row.bust.trim() || "—",
              waist: row.waist.trim() || "—",
              hips: row.hips.trim() || "—",
              shoes: row.shoes.trim() || "—",
            }
          : null,
        polaroidsGallery,
        runwayVideoUrl:
          row.runway_video_url?.trim() || seedMatch?.runway_video_url,
      };
    })
  );

  return {
    status: "authorized",
    token: pkg.token,
    clientName: pkg.clientName,
    expiresAt: pkg.expiresAt,
    showMeasurements: pkg.showMeasurements,
    castingNote: pkg.castingNote,
    requiresPin: Boolean(pkg.pinCode),
    signedAtIso: new Date().toISOString(),
    signedUrlsTtlMinutes: ttlMinutes,
    talents: fullProfiles,
  };
}
