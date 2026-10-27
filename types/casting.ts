/* ============================================================
   OOPSY — Private B2B Casting Package Types (types/casting.ts)

   Define la estructura de los paquetes de casting privados (`/casting/[token]`),
   sus estados de validación de seguridad (vigencia temporal, bloqueo por PIN,
   token inexistente) y las respuestas tipadas hacia la capa de presentación.
   ============================================================ */

import type { FullTalentCastingProfile } from "@/types/talent";

/**
 * Representación cruda de una fila de la pestaña "Packages de Casting" en Google Sheets
 */
export interface RawCastingPackageSheetRow {
  /** Slug criptográfico único (ej: "falabella-ss27-9x2") */
  token: string;
  /** Nombre del cliente, marca o productora destinataria */
  client_name: string;
  /** Lista de IDs de talentos separados por coma o array JSON (ej: "TAL-001, TAL-002") */
  model_ids: string | string[];
  /** Flag booleano para autorizar visualización de medidas anatómicas */
  show_measurements: boolean | string;
  /** Fecha y hora de expiración en formato ISO 8601 (ej: "2027-03-15T23:59:59Z") */
  expires_at: string;
  /** Código PIN opcional de 4 dígitos para doble factor de acceso */
  pin_code?: string;
  /** Nota o brief editorial opcional para el director de casting */
  casting_note?: string;
}

/**
 * Entidad normalizada de un Package de Casting en el dominio del servidor
 */
export interface CastingPackageRecord {
  token: string;
  clientName: string;
  modelIds: string[];
  showMeasurements: boolean;
  expiresAt: string;
  /** PIN de 4 dígitos (nunca se serializa ni se envía al cliente) */
  pinCode?: string;
  castingNote?: string;
}

/**
 * Resultado discriminado de la validación y carga de un Package de Casting.
 *
 * Seguridad por diseño (Ley N° 21.719):
 * - Cuando `status === "requires_pin"`, el payload NO incluye los perfiles
 *   de las modelos ni las URLs firmadas de las Polaroids. Estos solo se
 *   entregan tras verificar el PIN en el servidor.
 * - Cuando `status === "expired"`, el servidor detiene la firma de assets y
 *   retorna únicamente metadatos básicos para renderizar la vista de caducidad.
 */
export type CastingPackageResolution =
  | {
      status: "not_found";
      token: string;
    }
  | {
      status: "expired";
      token: string;
      clientName: string;
      expiresAt: string;
    }
  | {
      status: "requires_pin";
      token: string;
      clientName: string;
      expiresAt: string;
      castingNote?: string;
      totalTalentsCount: number;
      pinError?: string;
    }
  | {
      status: "authorized";
      token: string;
      clientName: string;
      expiresAt: string;
      showMeasurements: boolean;
      castingNote?: string;
      requiresPin: boolean;
      /** Timestamp ISO en que se firmaron las URLs temporales de este paquete */
      signedAtIso: string;
      /** Tiempo de vida (TTL en minutos) de las URLs firmadas de Polaroids */
      signedUrlsTtlMinutes: number;
      /** Perfiles completos de los talentos asignados al package */
      talents: FullTalentCastingProfile[];
    };
