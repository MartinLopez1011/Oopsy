"use server";

/* ============================================================
   OOPSY — Server Action for Private Casting PIN Verification
   (app/casting/[token]/actions.ts)

   Seguridad Ley N° 21.719:
   La validación del PIN de 4 dígitos y la generación de las URLs
   firmadas de Polaroids ocurren exclusivamente en el servidor de Next.js.
   El cliente jamás recibe las medidas ni las URLs de las Polaroids hasta
   que esta acción confirma el PIN en tiempo constante (`timingSafeEqual`).
   ============================================================ */

import { getCastingPackage } from "@/lib/repository";
import type { CastingPackageResolution } from "@/types/casting";

export async function verifyCastingPinAction(
  token: string,
  pin: string
): Promise<CastingPackageResolution> {
  const sanitizedPin = (pin || "").replace(/\D/g, "").slice(0, 4);

  if (sanitizedPin.length !== 4) {
    return getCastingPackage(token, { providedPin: "__INVALID_LENGTH__" });
  }

  return getCastingPackage(token, { providedPin: sanitizedPin });
}
