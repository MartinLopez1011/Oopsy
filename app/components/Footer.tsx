import Link from "next/link";
import Image from "next/image";

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://instagram.com/oopsy.cl?igsi=MXBkZTY1b2JxOXcybw==",
    svgPath: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
  },
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/company/oopsy/",
    svgPath: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
  },
];

export default function Footer() {
  return (
    <footer id="footer" className="relative overflow-hidden bg-dark text-neutral/70">
      {/* Pattern overlay */}
      <div
        className="absolute inset-0 opacity-8"
        style={{
          backgroundImage: "url('/images/patterns/dots-dark.png')",
          backgroundSize: "200px",
          backgroundRepeat: "repeat",
        }}
        aria-hidden="true"
      />

      {/* Large watermark isotipo */}
      <div className="absolute -bottom-16 -right-16 opacity-[0.03] pointer-events-none" aria-hidden="true">
        <Image src="/images/icons/isotipo-pink.png" alt="" width={400} height={400} className="w-72 h-72 md:w-96 md:h-96" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-5 pt-16 pb-8 md:px-8 md:pt-20">
        {/* Top section */}
        <div className="flex flex-col items-center gap-10 pb-12 md:flex-row md:justify-between md:items-start">
          {/* Logo + tagline */}
          <div className="flex flex-col items-center gap-4 md:items-start md:max-w-xs">
            <Image
              src="/images/logo-pink.png"
              alt="Oopsy"
              width={140}
              height={45}
              className="h-8 w-auto object-contain"
            />
            <p className="text-center text-[0.85rem] font-light leading-relaxed font-body text-neutral/40 md:text-left">
              Agencia creativa que transforma ideas en experiencias visuales únicas e inolvidables.
            </p>
            {/* Social icons inline on desktop */}
            <div className="hidden md:flex items-center gap-2.5 mt-2">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/8 text-neutral/35 transition-brand hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                  aria-label={`Seguir a Oopsy en ${social.name}`}
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={social.svgPath} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Navigation column */}
          <div className="flex flex-col items-center gap-3.5 md:items-start">
            <h4 className="text-[0.65rem] font-semibold tracking-[0.2em] text-neutral/25 uppercase font-body">
              Navegación
            </h4>
            <div className="flex flex-col items-center gap-2.5 md:items-start">
              <Link href="#hero" className="text-sm text-neutral/45 transition-brand hover:text-primary font-body">Inicio</Link>
              <Link href="#servicios" className="text-sm text-neutral/45 transition-brand hover:text-primary font-body">Servicios</Link>
              <Link href="#contacto" className="text-sm text-neutral/45 transition-brand hover:text-primary font-body">Contacto</Link>
            </div>
          </div>

          {/* Mobile social icons */}
          <div className="flex flex-col items-center gap-3 md:hidden">
            <div className="flex items-center gap-3">
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-neutral/40 transition-brand hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                  aria-label={`Seguir a Oopsy en ${social.name}`}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d={social.svgPath} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

        {/* Bottom section */}
        <div className="mt-7 flex flex-col items-center gap-2 md:flex-row md:justify-between">
          <p className="text-[0.75rem] text-neutral/25 font-body">
            © {new Date().getFullYear()} Oopsy. Todos los derechos reservados.
          </p>
          <p className="text-[0.75rem] text-neutral/18 font-body">
            Hecho con{" "}
            <span className="inline-block animate-pulse text-secondary">♥</span>
            {" "}en Chile
          </p>
        </div>
      </div>
    </footer>
  );
}
