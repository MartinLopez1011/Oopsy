import Image from "next/image";
import Link from "next/link";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-svh items-center justify-center overflow-hidden bg-dark"
    >
      {/* Background image with parallax-like feel */}
      <Image
        src="/images/hero-bg.jpg"
        alt="Oopsy — Fondo editorial"
        fill
        className="object-cover opacity-70 scale-105"
        priority
        quality={90}
      />

      {/* Multi-layer gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-dark/60 via-dark/25 to-dark/80" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-dark/40 via-transparent to-dark/40" aria-hidden="true" />

      {/* Bottom fade to surface */}
      <div className="absolute right-0 bottom-0 left-0 h-40 bg-gradient-to-t from-surface via-surface/60 to-transparent" aria-hidden="true" />

      {/* Animated floating isotipos */}
      <div className="absolute top-[12%] left-[6%] animate-float-slow opacity-20 md:opacity-35 pointer-events-none" aria-hidden="true">
        <Image src="/images/icons/isotipo-pink.png" alt="" width={140} height={140} className="w-20 h-20 md:w-32 md:h-32 drop-shadow-2xl" />
      </div>
      <div className="absolute top-[20%] right-[8%] animate-float opacity-15 md:opacity-30 pointer-events-none" style={{ animationDelay: "1.5s" }} aria-hidden="true">
        <Image src="/images/icons/isotipo-green.png" alt="" width={120} height={120} className="w-16 h-16 md:w-24 md:h-24 drop-shadow-2xl" />
      </div>
      <div className="absolute bottom-[25%] left-[12%] animate-float opacity-10 md:opacity-20 pointer-events-none" style={{ animationDelay: "0.8s" }} aria-hidden="true">
        <Image src="/images/icons/isotipo-blue.png" alt="" width={90} height={90} className="w-12 h-12 md:w-20 md:h-20 drop-shadow-2xl" />
      </div>
      <div className="absolute bottom-[40%] right-[4%] animate-float-slow opacity-10 md:opacity-15 pointer-events-none" style={{ animationDelay: "2s" }} aria-hidden="true">
        <Image src="/images/icons/isotipo-pink.png" alt="" width={70} height={70} className="w-10 h-10 md:w-16 md:h-16 drop-shadow-xl" />
      </div>
      {/* Extra isotipo for depth */}
      <div className="hidden md:block absolute top-[55%] left-[45%] animate-float opacity-8 pointer-events-none" style={{ animationDelay: "3s" }} aria-hidden="true">
        <Image src="/images/icons/isotipo-green.png" alt="" width={50} height={50} className="w-10 h-10 drop-shadow-xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-5xl px-5 text-center md:px-8">
        {/* Badge */}
        <div className="animate-fade-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-5 py-2 backdrop-blur-xl">
          <Image src="/images/icons/isotipo-pink.png" alt="" width={20} height={20} className="h-4 w-4" />
          <span className="text-xs font-medium tracking-[0.15em] text-white/90 uppercase font-body">
            Agencia Creativa
          </span>
        </div>

        {/* H1 — Using Melodrama */}
        <h1 className="animate-fade-up-d1 font-heading text-[2.75rem] font-medium leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]">
          Creatividad
          <br />
          <span className="italic text-primary">sin límites</span>
        </h1>

        {/* Divider line */}
        <div className="animate-fade-up-d2 mx-auto mt-6 h-px w-16 bg-gradient-to-r from-transparent via-primary/60 to-transparent md:mt-8 md:w-24" />

        {/* Subtitle */}
        <p className="animate-fade-up-d2 mx-auto mt-6 max-w-lg text-[0.95rem] font-light leading-relaxed text-white/75 font-body sm:text-lg md:mt-8 md:text-xl md:max-w-xl">
          Transformamos ideas en experiencias visuales únicas que conectan
          con tu audiencia y hacen crecer tu marca.
        </p>

        {/* CTAs */}
        <div className="animate-fade-up-d3 mt-9 flex items-center justify-center md:mt-12">
          <Link
            href="#contacto"
            className="group inline-flex items-center gap-2.5 rounded-full bg-primary px-8 py-3.5 text-[0.95rem] font-semibold text-dark shadow-lg shadow-primary/20 transition-brand hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 sm:px-10 sm:py-4 sm:text-base btn-shimmer"
          >
            Empecemos
            <svg className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="animate-fade-up-d4 absolute bottom-24 left-1/2 z-10 -translate-x-1/2 md:bottom-20">
        <Link
          href="#servicios"
          className="group flex flex-col items-center gap-2.5 text-white/40 transition-brand hover:text-white/70"
          aria-label="Desplazar hacia abajo"
        >
          <span className="text-[0.65rem] font-light tracking-[0.2em] uppercase font-body">
            Scroll
          </span>
          <div className="flex h-9 w-5.5 items-start justify-center rounded-full border border-white/25 pt-1.5">
            <div className="h-2 w-1 rounded-full bg-white/60 animate-bounce-gentle" />
          </div>
        </Link>
      </div>
    </section>
  );
}
