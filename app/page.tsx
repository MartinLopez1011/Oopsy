export default function Home() {
  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden px-6">
      {/* Decorative corner marks */}
      <div className="pointer-events-none absolute top-8 left-8 h-12 w-12 border-t border-l border-line opacity-40" />
      <div className="pointer-events-none absolute top-8 right-8 h-12 w-12 border-t border-r border-line opacity-40" />
      <div className="pointer-events-none absolute bottom-8 left-8 h-12 w-12 border-b border-l border-line opacity-40" />
      <div className="pointer-events-none absolute bottom-8 right-8 h-12 w-12 border-b border-r border-line opacity-40" />

      {/* Content */}
      <div className="flex flex-col items-center text-center">
        {/* Agency name */}
        <h1 className="animate-fade-up font-serif text-6xl font-light tracking-[0.35em] sm:text-7xl md:text-8xl lg:text-9xl">
          OOPSY
        </h1>

        {/* Decorative line */}
        <div className="animate-line-expand mt-10 h-px bg-ink-muted" />

        {/* Subtitle */}
        <p className="animate-fade-up-delay-2 mt-10 max-w-md font-sans text-sm font-extralight leading-relaxed tracking-[0.15em] text-ink-light sm:text-base">
          Estamos preparando algo increíble.
          <br />
          Sitio en construcción.
        </p>
      </div>


    </main>
  );
}
