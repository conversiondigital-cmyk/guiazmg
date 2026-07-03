import { unstable_cache } from "next/cache"
import { prisma } from "@/lib/prisma"

// SEO base del sitio. Estos valores se usan como default y, si el admin los
// edita en /admin/configuracion/seo (tabla system_settings), esos ganan.
// Redactados como "el mejor SEO local" para Guía ZMG (directorio ZMG).
export const SEO_DEFAULTS = {
  title: "Guía ZMG — Directorio de Negocios y Servicios en Guadalajara",
  description:
    "Encuentra negocios, profesionales y servicios en Guadalajara, Zapopan, Tlaquepaque, Tonalá y toda la ZMG: teléfonos, ubicación, horarios, reseñas y promociones en un solo lugar.",
  keywords:
    "negocios en Guadalajara, directorio Guadalajara, guía comercial Guadalajara, servicios en Guadalajara, negocios Zapopan, negocios Tlaquepaque, negocios Tonalá, profesionales Guadalajara, dónde comprar en Guadalajara, negocios locales Jalisco, ZMG",
  schemaType: "LocalBusiness",
}

// robots.txt por defecto: abre el sitio público y bloquea rutas privadas/panel.
export function defaultRobotsTxt(baseUrl: string, sitemapEnabled: boolean): string {
  const lines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /admin/",
    "Disallow: /editor/",
    "Disallow: /agente/",
    "Disallow: /dashboard/",
    "Disallow: /auth/",
    "Disallow: /checkout",
    "Disallow: /marketplace/nuevo",
    "Disallow: /registrar-negocio",
  ]
  if (sitemapEnabled) lines.push("", `Sitemap: ${baseUrl}/sitemap.xml`)
  return lines.join("\n")
}

const KEYS = [
  "meta_title",
  "meta_description",
  "meta_keywords",
  "schema_org_type",
  "enable_sitemap",
  "robots_txt_content",
]

// Cacheado: no le pega a la BD en cada página. Se revalida por tiempo (5 min),
// así que un cambio en /admin/configuracion/seo se refleja en el SEO público
// en un máximo de ~5 minutos.
export const getSeoSettings = unstable_cache(
  async () => {
    let map = new Map<string, string>()
    try {
      const rows = await prisma.systemSetting.findMany({
        where: { key: { in: KEYS } },
        select: { key: true, value: true },
      })
      map = new Map(rows.map((r) => [r.key, (r.value ?? "").trim()]))
    } catch {
      // Sin BD: se usan los defaults.
    }
    const val = (k: string) => map.get(k) || ""
    const sitemapRaw = val("enable_sitemap").toLowerCase()
    return {
      title: val("meta_title") || SEO_DEFAULTS.title,
      description: val("meta_description") || SEO_DEFAULTS.description,
      keywords: (val("meta_keywords") || SEO_DEFAULTS.keywords)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      schemaType: val("schema_org_type") || SEO_DEFAULTS.schemaType,
      // Sin valor guardado → habilitado por defecto.
      sitemapEnabled: sitemapRaw === "" ? true : ["true", "1", "on"].includes(sitemapRaw),
      robotsTxt: val("robots_txt_content"),
    }
  },
  ["seo-settings"],
  { revalidate: 300, tags: ["seo-settings"] }
)
