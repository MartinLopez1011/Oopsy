/* ============================================================
   OOPSY — Página "En Construcción" (/en-construccion)
   Estética editorial minimalista de marca Oopsy
   ============================================================ */
import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "En Construcción | OOPSY — Agencia Creativa & Producción Editorial",
  description:
    "Estamos preparando una nueva experiencia editorial para Oopsy. Producción de moda, sesiones fotográficas y cobertura editorial en Chile.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function UnderConstructionPage() {
  return (
    <section className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-dark px-5 py-24 text-center text-neutral md:px-8">
      {/* Imagen de fondo editorial */}
      <Image
        src="/images/hero-bg.jpg"
        alt="Oopsy — En Construcción"
        fill
        priority
        quality={90}
        className="object-cover opacity-35 scale-105"
      />

      {/* Capas de gradiente para contraste */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-dark/80 via-dark/65 to-dark-deep/95"
        aria-hidden="true"
      />

      {/* Isotipos flotantes decorativos */}
      <div
        className="pointer-events-none absolute top-[14%] left-[8%] animate-float-slow opacity-20 md:opacity-30"
        aria-hidden="true"
      >
        <Image
          src="/images/icons/isotipo-pink.png"
          alt=""
          width={120}
          height={120}
          className="h-16 w-16 md:h-24 md:w-24 drop-shadow-2xl"
        />
      </div>
      <div
        className="pointer-events-none absolute bottom-[18%] right-[10%] animate-float opacity-15 md:opacity-25"
        style={{ animationDelay: "1.4s" }}
        aria-hidden="true"
      >
        <Image
          src="/images/icons/isotipo-green.png"
          alt=""
          width={100}
          height={100}
          className="h-14 w-14 md:h-20 md:w-20 drop-shadow-2xl"
        />
      </div>

      {/* Contenido central */}
      <div className="relative z-10 mx-auto flex max-w-2xl flex-col items-center">
        {/* Badge de estado */}
        <div className="mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-5 py-2 backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          <span className="font-body text-xs font-medium tracking-[0.22em] text-white/90 uppercase">
            Sitio en Construcción
          </span>
        </div>

        {/* Título con tipografía Melodrama */}
        <h1 className="font-heading text-4xl font-medium leading-[1.06] tracking-tight text-white sm:text-6xl md:text-7xl">
          Estamos preparando
          <br />
          <span className="italic text-primary">algo extraordinario</span>
        </h1>

        <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

        <p className="mt-6 max-w-lg font-body text-base font-light leading-relaxed text-white/75 md:text-lg">
          Nuestra nueva plataforma y archivo de portafolio editorial están en
          fase de curaduría y ajustes finales. Muy pronto disponible.
        </p>

        {/* Contacto directo / Instagram */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://instagram.com/oopsy.cl"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-3.5 font-body text-sm font-semibold tracking-wide text-dark shadow-lg shadow-primary/20 transition-brand hover:-translate-y-0.5 hover:bg-primary-dark"
          >
            Síguenos en Instagram @oopsy.cl
          </a>
        </div>
      </div>
    </section>
  );
}
