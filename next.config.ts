import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "**.r2.dev",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    return [
      {
        // Regla obligatoria Ley N° 21.719: impedir indexación y caché público de paquetes de casting privados
        source: "/casting/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noindex, nofollow",
          },
          {
            key: "Cache-Control",
            value: "private, no-store, no-cache, must-revalidate",
          },
        ],
      },
    ];
  },
  async redirects() {
    // Si NEXT_PUBLIC_MAINTENANCE_MODE === "false", desactiva la redirección
    if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "false") {
      return [];
    }
    return [
      {
        source: "/",
        destination: "/en-construccion",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
