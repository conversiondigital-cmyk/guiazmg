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
}

export default nextConfig
