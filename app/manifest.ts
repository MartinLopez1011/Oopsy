/* ============================================================
   Web App Manifest — Oopsy
   
   Provides PWA and search engine discovery metadata with
   application icon definitions for Google Search and mobile devices.
   ============================================================ */
import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OOPSY — Creatividad sin límites | Agencia de Modelaje y Producción",
    short_name: "OOPSY",
    description:
      "Agencia de modelaje y producción creativa que transforma ideas en experiencias visuales únicas.",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0f",
    theme_color: "#ff2d78",
    icons: [
      {
        src: "/images/icons/isotipo-pink.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
