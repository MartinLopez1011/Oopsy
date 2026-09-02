"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

const NAV_LINKS = [
  { label: "Inicio", href: "#hero" },
  { label: "Servicios", href: "#servicios" },
  { label: "Contacto", href: "#contacto" },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileMenuOpen]);

  return (
    <header
      id="navbar"
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "glass border-b border-border-light/50 shadow-sm py-0"
          : "bg-transparent py-1"
      }`}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8 lg:px-12">
        {/* Logo — switches from green (on dark hero) to logotipo (on scrolled white bg) */}
        <Link href="/" className="relative z-50 flex items-center group">
          <Image
            src={isScrolled ? "/images/logo.png" : "/images/logo-green.png"}
            alt="Oopsy"
            width={160}
            height={48}
            className="h-7 w-auto object-contain transition-all duration-500 group-hover:scale-105 md:h-8"
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium transition-brand group ${
                  isScrolled
                    ? "text-text-body hover:text-dark"
                    : "text-white/80 hover:text-white"
                }`}
              >
                {link.label}
                <span className={`absolute bottom-0 left-1/2 h-0.5 w-0 -translate-x-1/2 rounded-full transition-all duration-300 group-hover:w-3/4 ${
                  isScrolled ? "bg-secondary" : "bg-primary"
                }`} />
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <Link
          href="#contacto"
          className={`hidden items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold shadow-md transition-brand hover:shadow-lg hover:-translate-y-0.5 md:inline-flex btn-shimmer ${
            isScrolled
              ? "bg-dark text-neutral hover:bg-dark-deep"
              : "bg-primary text-dark hover:bg-primary-dark"
          }`}
        >
          Contáctanos
        </Link>

        {/* Mobile hamburger */}
        <button
          id="mobile-menu-toggle"
          type="button"
          className={`relative z-50 flex h-10 w-10 items-center justify-center rounded-full md:hidden transition-colors duration-300 ${
            isMobileMenuOpen
              ? "bg-neutral/80"
              : isScrolled
                ? "bg-neutral/80"
                : "bg-white/10 backdrop-blur-sm"
          }`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isMobileMenuOpen}
        >
          <div className="flex flex-col items-center justify-center gap-[5px]">
            <span className={`block h-[2px] w-5 rounded-full transition-all duration-300 ${
              isMobileMenuOpen
                ? "translate-y-[7px] rotate-45 bg-dark"
                : isScrolled ? "bg-dark" : "bg-white"
            }`} />
            <span className={`block h-[2px] w-5 rounded-full transition-all duration-300 ${
              isMobileMenuOpen
                ? "scale-x-0 opacity-0"
                : isScrolled ? "bg-dark" : "bg-white"
            }`} />
            <span className={`block h-[2px] w-5 rounded-full transition-all duration-300 ${
              isMobileMenuOpen
                ? "-translate-y-[7px] -rotate-45 bg-dark"
                : isScrolled ? "bg-dark" : "bg-white"
            }`} />
          </div>
        </button>
      </nav>

      {/* Mobile fullscreen menu */}
      <div
        className={`fixed inset-0 z-40 flex flex-col transition-all duration-500 md:hidden ${
          isMobileMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      >
        {/* Background with brand pattern */}
        <div
          className="absolute inset-0 bg-neutral"
          style={{
            backgroundImage: "url('/images/patterns/dots-light.png')",
            backgroundSize: "260px",
            backgroundRepeat: "repeat",
          }}
        />

        {/* Floating decor */}
        <div className="absolute top-24 right-8 opacity-12 animate-float-slow pointer-events-none" aria-hidden="true">
          <Image src="/images/icons/isotipo-pink.png" alt="" width={100} height={100} className="w-20 h-20" />
        </div>
        <div className="absolute bottom-36 left-8 opacity-8 animate-float pointer-events-none" style={{ animationDelay: "1s" }} aria-hidden="true">
          <Image src="/images/icons/isotipo-green.png" alt="" width={70} height={70} className="w-14 h-14" />
        </div>

        <div className="relative z-10 flex h-full flex-col items-center justify-center gap-7 px-8">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className="font-heading text-[2.5rem] font-medium text-dark transition-brand hover:text-secondary-dark leading-tight"
              style={{
                opacity: isMobileMenuOpen ? 1 : 0,
                transform: isMobileMenuOpen ? "translateY(0)" : "translateY(24px)",
                transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.15 + i * 0.08}s`,
              }}
            >
              {link.label}
            </Link>
          ))}

          {/* Divider */}
          <div
            className="h-px w-16 bg-gradient-to-r from-transparent via-secondary/40 to-transparent"
            style={{
              opacity: isMobileMenuOpen ? 1 : 0,
              transition: `opacity 0.5s 0.4s`,
            }}
          />

          <Link
            href="#contacto"
            onClick={() => setIsMobileMenuOpen(false)}
            className="rounded-full bg-dark px-10 py-3.5 text-lg font-semibold text-neutral shadow-xl transition-brand hover:bg-dark-deep btn-shimmer"
            style={{
              opacity: isMobileMenuOpen ? 1 : 0,
              transform: isMobileMenuOpen ? "translateY(0)" : "translateY(24px)",
              transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s`,
            }}
          >
            Contáctanos
          </Link>
        </div>
      </div>
    </header>
  );
}
