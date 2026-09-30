/* ============================================================
   Structured Data (JSON-LD) Component — Oopsy
   
   Renders schema.org Organization and ProfessionalService metadata
   for search engine discovery, rich snippets, and Google Knowledge Graph.
   ============================================================ */

import { normalizeSiteUrl } from "@/app/lib/siteUrl";

interface JsonLdProps {
  siteUrl?: string;
}

export default function JsonLd({ siteUrl }: JsonLdProps) {
  const normalizedUrl = normalizeSiteUrl(
    siteUrl || process.env.NEXT_PUBLIC_SITE_URL
  );

  const schemaData = {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    "@id": `${normalizedUrl}/#organization`,
    name: "OOPSY",
    alternateName: "OOPSY Agencia de Modelaje y Creatividad",
    url: normalizedUrl,
    logo: `${normalizedUrl}/images/logo.png`,
    image: `${normalizedUrl}/images/hero-bg.jpg`,
    description:
      "Agencia de modelaje y producción creativa que transforma ideas en experiencias visuales únicas. Especialistas en producción de eventos de moda, sesiones fotográficas editoriales y dirección creativa.",
    email: "contacto@oopsy.cl",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Santiago",
      addressRegion: "Región Metropolitana",
      addressCountry: "CL",
    },
    sameAs: [
      "https://www.instagram.com/oopsy.cl",
      "https://www.linkedin.com/company/oopsy/",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Servicios de Modelaje y Producción de Moda",
      itemListElement: [
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Producción de Eventos de Moda",
            description:
              "Diseño, logística y ejecución de desfiles, showrooms y lanzamientos de colecciones.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Sesiones Fotográficas Editoriales",
            description:
              "Dirección de arte, estilismo y producción completa para campañas editoriales y comerciales.",
          },
        },
        {
          "@type": "Offer",
          itemOffered: {
            "@type": "Service",
            name: "Cobertura Editorial",
            description:
              "Documentación visual y cobertura insider de los eventos más relevantes del circuito de la moda.",
          },
        },
      ],
    },
  };

  const jsonString = JSON.stringify(schemaData).replace(/</g, "\\u003c");

  return (
    <script
      id="organization-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: jsonString }}
    />
  );
}
