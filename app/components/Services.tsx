"use client";

import Image from "next/image";
import { useReveal, staggerDelay } from "@/app/hooks/useReveal";

const SERVICES = [
  {
    id: "pilar-1",
    icon: "/images/icons/isotipo-pink.png",
    gradient: "from-secondary/20 to-secondary/5",
    borderColor: "hover:border-secondary/30",
    number: "01",
    title: "Producción de Eventos de Moda",
    description:
      "Diseño, logística y ejecución de desfiles, showrooms y lanzamientos de colecciones.",
  },
  {
    id: "pilar-2",
    icon: "/images/icons/isotipo-green.png",
    gradient: "from-primary/20 to-primary/5",
    borderColor: "hover:border-primary/30",
    number: "02",
    title: "Sesiones Fotográficas",
    description:
      "Dirección de arte, estilismo y producción completa para campañas editoriales y comerciales.",
  },
  {
    id: "pilar-3",
    icon: "/images/icons/isotipo-blue.png",
    gradient: "from-accent/20 to-accent/5",
    borderColor: "hover:border-accent/30",
    number: "03",
    title: "Cobertura Editorial",
    description:
      "Documentación visual y cobertura insider de los eventos más relevantes del circuito de la moda.",
  },
];

export default function Services() {
  const headerReveal = useReveal();
  const cardsReveal = useReveal(0.08);

  return (
    <section
      id="servicios"
      className="relative overflow-hidden px-5 py-24 md:px-8 md:py-32 lg:py-40"
    >
      {/* Subtle dot pattern */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: "url('/images/patterns/dots-light.png')",
          backgroundSize: "240px",
          backgroundRepeat: "repeat",
        }}
        aria-hidden="true"
      />

      {/* Decorative blobs */}
      <div className="absolute top-20 -left-40 h-[500px] w-[500px] rounded-full bg-primary/8 blur-3xl animate-pulse-soft" aria-hidden="true" />
      <div className="absolute -bottom-20 -right-40 h-[500px] w-[500px] rounded-full bg-secondary/8 blur-3xl animate-pulse-soft" style={{ animationDelay: "2s" }} aria-hidden="true" />
      <div className="absolute top-1/2 left-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/5 blur-3xl" aria-hidden="true" />

      <div className="relative z-10 mx-auto max-w-7xl">
        {/* Header */}
        <div
          ref={headerReveal.ref}
          className={`reveal mx-auto max-w-2xl text-center ${headerReveal.isVisible ? "visible" : ""}`}
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/8 px-4 py-1.5 text-[0.7rem] font-semibold tracking-[0.15em] text-secondary-dark uppercase font-body">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
            Lo que hacemos
          </span>

          <h2 className="mt-6 font-heading text-[2rem] font-semibold text-text-heading sm:text-4xl md:text-5xl lg:text-6xl">
            Nuestros pilares
            <br />
            <span className="italic text-gradient">de trabajo</span>
          </h2>

          <div className="mx-auto mt-4 h-px w-12 bg-gradient-to-r from-transparent via-secondary/50 to-transparent" />

          <p className="mt-5 text-[0.95rem] text-text-muted font-body md:text-lg">
            Moda, producción y visión creativa al servicio de tu marca.
          </p>
        </div>

        {/* Cards grid */}
        <div
          ref={cardsReveal.ref}
          className="mt-16 grid grid-cols-1 gap-5 md:mt-20 md:grid-cols-3 md:gap-7"
        >
          {SERVICES.map((service, i) => (
            <article
              key={service.id}
              id={service.id}
              className={`reveal group relative overflow-hidden rounded-3xl border border-border bg-surface/80 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2.5 hover:shadow-2xl hover:shadow-dark/8 ${
                cardsReveal.isVisible ? "visible" : ""
              } ${service.borderColor}`}
              style={staggerDelay(i, 0.15)}
            >
              {/* Gradient header area */}
              <div className={`relative bg-gradient-to-b ${service.gradient} px-8 pt-8 pb-6 md:px-10 md:pt-10 md:pb-8`}>
                {/* Number tag */}
                <span className="absolute top-6 right-6 font-heading text-[2.5rem] font-bold leading-none text-dark/5 md:top-8 md:right-8 md:text-5xl">
                  {service.number}
                </span>

                {/* Icon with hover animation */}
                <div className="relative h-16 w-16 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 md:h-20 md:w-20">
                  <Image
                    src={service.icon}
                    alt={`Ícono de ${service.title}`}
                    fill
                    className="object-contain drop-shadow-lg"
                  />
                </div>
              </div>

              {/* Content area */}
              <div className="px-8 pb-8 md:px-10 md:pb-10">
                <h3 className="font-heading text-xl font-semibold text-text-heading md:text-[1.4rem]">
                  {service.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-text-muted font-body md:text-[0.95rem]">
                  {service.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
