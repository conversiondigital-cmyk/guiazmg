import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  devIndicators: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
    ],
    // Permite servir los SVG locales de los negocios demo (public/demo/**) vía
    // next/image. Es seguro: los SVG se sirven en sandbox y sin scripts.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Cabeceras de seguridad para TODAS las respuestas, incluidos los assets
  // estáticos e imágenes (/_next/static, /_next/image) que el middleware
  // (src/proxy.ts) NO cubre porque su matcher los excluye. La CSP completa la
  // sigue poniendo el middleware en las páginas HTML; aquí solo van las cabeceras
  // "planas" que también deben estar en JS/imágenes (nosniff, anti-frame, etc.).
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
        ],
      },
    ]
  },
}

export default nextConfig
