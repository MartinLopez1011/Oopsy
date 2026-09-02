import Image from "next/image";

/**
 * Infinite scrolling marquee with brand isotipos
 * Uses two identical sets rendered side-by-side for seamless looping
 */
export default function Marquee() {
  const items = [
    { text: "Eventos de Moda", icon: "/images/icons/isotipo-pink.png" },
    { text: "Shooting", icon: "/images/icons/isotipo-green.png" },
    { text: "Fashion PR", icon: "/images/icons/isotipo-blue.png" },
    { text: "Desfiles", icon: "/images/icons/isotipo-pink.png" },
    { text: "Campañas Editoriales", icon: "/images/icons/isotipo-green.png" },
    { text: "Cobertura Insider", icon: "/images/icons/isotipo-blue.png" },
  ];

  const renderItems = (keyPrefix: string) =>
    items.map((item, i) => (
      <div key={`${keyPrefix}-${i}`} className="flex shrink-0 items-center gap-3">
        <Image
          src={item.icon}
          alt=""
          width={28}
          height={28}
          className="h-5 w-5 opacity-60 md:h-6 md:w-6"
          aria-hidden="true"
        />
        <span className="whitespace-nowrap font-heading text-sm font-medium tracking-wide text-text-muted/70 uppercase md:text-base">
          {item.text}
        </span>
        <span className="text-primary/40 text-lg" aria-hidden="true">✦</span>
      </div>
    ));

  return (
    <div className="relative overflow-hidden border-y border-border-light bg-neutral py-4 md:py-5">
      <div
        className="flex w-max items-center gap-8 md:gap-12"
        style={{
          animation: "marquee 25s linear infinite",
        }}
      >
        {/* First set */}
        {renderItems("a")}
        {/* Second set — identical copy for seamless loop */}
        {renderItems("b")}
      </div>
    </div>
  );
}
