"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useReveal } from "@/app/hooks/useReveal";
import { trackEvent } from "@/app/lib/gtag";

export default function Contact() {
  const reveal = useReveal();
  const [formState, setFormState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormState("sending");

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          subject: formData.get("subject"),
          message: formData.get("message"),
        }),
      });

      if (res.ok) {
        trackEvent("generate_lead", {
          event_category: "Contact",
          event_label: String(formData.get("subject") || "General"),
        });
        setFormState("sent");
        form.reset();
        setTimeout(() => setFormState("idle"), 5000);
      } else {
        setFormState("error");
        setTimeout(() => setFormState("idle"), 4000);
      }
    } catch {
      setFormState("error");
      setTimeout(() => setFormState("idle"), 4000);
    }
  }

  return (
    <section
      id="contacto"
      className="relative overflow-hidden"
    >
      {/* Wavy divider top */}
      <div className="relative -mt-px h-16 md:h-24 bg-surface">
        <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 1440 96" preserveAspectRatio="none" fill="none">
          <path d="M0 96L1440 96L1440 0C1440 0 1080 64 720 64C360 64 0 0 0 0L0 96Z" className="fill-primary"/>
        </svg>
      </div>

      {/* Main section */}
      <div className="relative px-5 py-20 md:px-8 md:py-28 lg:py-36">
        {/* Gradient base */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary-light" aria-hidden="true" />

        {/* Secondary gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-secondary/20 via-transparent to-accent/10" aria-hidden="true" />

        {/* Pattern overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: "url('/images/patterns/dots-light.png')",
            backgroundSize: "180px",
            backgroundRepeat: "repeat",
          }}
          aria-hidden="true"
        />

        {/* Floating isotipos */}
        <div className="absolute top-[8%] right-[6%] animate-float-slow opacity-20 pointer-events-none" aria-hidden="true">
          <Image src="/images/icons/isotipo-pink.png" alt="" width={120} height={120} className="w-20 h-20 md:w-28 md:h-28 drop-shadow-2xl" />
        </div>
        <div className="absolute bottom-[12%] left-[4%] animate-float opacity-15 pointer-events-none" style={{ animationDelay: "1.2s" }} aria-hidden="true">
          <Image src="/images/icons/isotipo-blue.png" alt="" width={90} height={90} className="w-14 h-14 md:w-22 md:h-22 drop-shadow-2xl" />
        </div>
        <div className="absolute top-[45%] left-[75%] animate-float-slow opacity-10 pointer-events-none" style={{ animationDelay: "2.5s" }} aria-hidden="true">
          <Image src="/images/icons/isotipo-green.png" alt="" width={70} height={70} className="w-12 h-12 md:w-16 md:h-16" />
        </div>

        {/* Blurred blobs */}
        <div className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-secondary/25 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-accent/20 blur-3xl" aria-hidden="true" />

        {/* Content */}
        <div
          ref={reveal.ref}
          className={`reveal relative z-10 mx-auto max-w-4xl ${reveal.isVisible ? "visible" : ""}`}
        >
          {/* Two-column layout: Text left + Form right */}
          <div className="flex flex-col items-center gap-12 lg:flex-row lg:items-start lg:gap-16">

            {/* Left column — text */}
            <div className="flex-1 text-center lg:text-left lg:pt-4">
              {/* Badge */}
              <span className="inline-flex items-center gap-2 rounded-full bg-dark/8 px-4 py-1.5 text-[0.7rem] font-semibold tracking-[0.15em] text-dark/60 uppercase font-body backdrop-blur-sm">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                Hablemos
              </span>

              {/* H2 */}
              <h2 className="mt-6 font-heading text-[2.25rem] font-semibold leading-[1.1] text-dark sm:text-5xl md:text-6xl">
                ¿Listo para dar el{" "}
                <span className="italic">siguiente paso</span>?
              </h2>

              {/* Divider */}
              <div className="mx-auto mt-5 h-px w-16 bg-gradient-to-r from-transparent via-dark/20 to-transparent lg:mx-0 md:mt-6" />

              {/* Description */}
              <p className="mx-auto mt-5 max-w-md text-[0.95rem] leading-relaxed text-dark/60 font-body md:mt-6 md:text-lg lg:mx-0">
                Conversemos sobre tu proyecto. Completa el formulario y nos pondremos
                en contacto contigo a la brevedad.
              </p>

              {/* Trust badges */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[0.75rem] font-medium text-dark/40 font-body lg:justify-start">
                <div className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Respuesta en 24h
                </div>
                <div className="flex items-center gap-1.5">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Sin compromiso
                </div>
              </div>
            </div>

            {/* Right column — form */}
            <div className="w-full max-w-md lg:flex-1">
              <form
                id="contacto-form"
                onSubmit={handleSubmit}
                className="rounded-3xl border border-white/20 bg-white/60 p-7 shadow-2xl shadow-dark/10 backdrop-blur-xl sm:p-8 md:p-10"
              >
                {/* Name */}
                <div className="mb-5">
                  <label htmlFor="contact-name" className="mb-1.5 block text-xs font-semibold tracking-wider text-dark/50 uppercase font-body">
                    Nombre
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    required
                    placeholder="Tu nombre completo"
                    className="w-full rounded-xl border border-dark/10 bg-white/80 px-4 py-3 text-sm text-dark placeholder-dark/30 font-body transition-brand focus:border-secondary/50 focus:ring-2 focus:ring-secondary/20 focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div className="mb-5">
                  <label htmlFor="contact-email" className="mb-1.5 block text-xs font-semibold tracking-wider text-dark/50 uppercase font-body">
                    Correo electrónico
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    required
                    placeholder="tu@correo.com"
                    className="w-full rounded-xl border border-dark/10 bg-white/80 px-4 py-3 text-sm text-dark placeholder-dark/30 font-body transition-brand focus:border-secondary/50 focus:ring-2 focus:ring-secondary/20 focus:outline-none"
                  />
                </div>

                {/* Subject */}
                <div className="mb-5">
                  <label htmlFor="contact-subject" className="mb-1.5 block text-xs font-semibold tracking-wider text-dark/50 uppercase font-body">
                    Asunto
                  </label>
                  <select
                    id="contact-subject"
                    name="subject"
                    required
                    defaultValue=""
                    className="w-full rounded-xl border border-dark/10 bg-white/80 px-4 py-3 text-sm text-dark font-body transition-brand focus:border-secondary/50 focus:ring-2 focus:ring-secondary/20 focus:outline-none appearance-none"
                  >
                    <option value="" disabled>Selecciona un servicio</option>
                    <option value="Eventos de Moda">Producción de Eventos de Moda</option>
                    <option value="Shooting">Sesiones Fotográficas (Shooting)</option>
                    <option value="Fashion PR">Cobertura Editorial (Fashion PR)</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <label htmlFor="contact-message" className="mb-1.5 block text-xs font-semibold tracking-wider text-dark/50 uppercase font-body">
                    Mensaje
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    required
                    rows={4}
                    placeholder="Cuéntanos sobre tu proyecto o idea..."
                    className="w-full resize-none rounded-xl border border-dark/10 bg-white/80 px-4 py-3 text-sm text-dark placeholder-dark/30 font-body transition-brand focus:border-secondary/50 focus:ring-2 focus:ring-secondary/20 focus:outline-none"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  id="contact-submit"
                  disabled={formState === "sending" || formState === "sent"}
                  className={`group w-full inline-flex items-center justify-center gap-2.5 rounded-full py-3.5 text-base font-semibold shadow-lg transition-brand sm:py-4 btn-shimmer ${
                    formState === "sent"
                      ? "bg-primary-dark text-dark shadow-primary/20"
                      : formState === "error"
                        ? "bg-secondary-dark text-white shadow-secondary/20"
                        : "bg-dark text-neutral shadow-dark/25 hover:bg-dark-deep hover:shadow-dark/35 hover:-translate-y-0.5"
                  } disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                >
                  {formState === "sending" && (
                    <>
                      <svg className="h-4.5 w-4.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Enviando...
                    </>
                  )}
                  {formState === "sent" && (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ¡Mensaje enviado!
                    </>
                  )}
                  {formState === "error" && (
                    <>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                      Error, intenta de nuevo
                    </>
                  )}
                  {formState === "idle" && (
                    <>
                      Enviar mensaje
                      <svg className="h-4.5 w-4.5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
