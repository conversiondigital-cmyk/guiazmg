import { prisma } from "@/lib/prisma"

// Contenido configurable del hero (textos y chips de búsqueda). Se guarda como
// JSON en systemSetting["hero_config"]. Las imágenes van aparte (hero-images.ts).
const KEY = "hero_config"

export interface HeroConfig {
  titlePrefix: string
  titleHighlight: string
  subtitle: string
  popular: string[]
  intervalMs: number
}

// Valores por defecto = lo que estaba hardcodeado en el hero.
export const DEFAULT_HERO_CONFIG: HeroConfig = {
  titlePrefix: "Encuentra lo mejor de",
  titleHighlight: "Guadalajara",
  subtitle:
    "Descubre negocios locales, servicios profesionales y los mejores rincones de la Zona Metropolitana de Guadalajara.",
  popular: ["Restaurantes", "Dentistas", "Gimnasios", "Cafeterías", "Talleres"],
  intervalMs: 5000,
}

function normalize(raw: unknown): HeroConfig {
  const o = (raw && typeof raw === "object" ? raw : {}) as Partial<HeroConfig>
  return {
    titlePrefix: typeof o.titlePrefix === "string" ? o.titlePrefix : DEFAULT_HERO_CONFIG.titlePrefix,
    titleHighlight: typeof o.titleHighlight === "string" ? o.titleHighlight : DEFAULT_HERO_CONFIG.titleHighlight,
    subtitle: typeof o.subtitle === "string" ? o.subtitle : DEFAULT_HERO_CONFIG.subtitle,
    popular: Array.isArray(o.popular)
      ? o.popular.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 12)
      : DEFAULT_HERO_CONFIG.popular,
    intervalMs:
      typeof o.intervalMs === "number" && o.intervalMs >= 2000 && o.intervalMs <= 30000
        ? o.intervalMs
        : DEFAULT_HERO_CONFIG.intervalMs,
  }
}

export async function getHeroConfig(): Promise<HeroConfig> {
  try {
    const s = await prisma.systemSetting.findUnique({ where: { key: KEY } })
    if (!s?.value) return DEFAULT_HERO_CONFIG
    return normalize(JSON.parse(s.value))
  } catch {
    return DEFAULT_HERO_CONFIG
  }
}

export async function setHeroConfig(config: Partial<HeroConfig>): Promise<HeroConfig> {
  const normalized = normalize(config)
  const value = JSON.stringify(normalized)
  await prisma.systemSetting.upsert({
    where: { key: KEY },
    update: { value, isSecret: false },
    create: { key: KEY, value, isSecret: false, description: "Contenido del hero (inicio): textos y búsquedas populares" },
  })
  return normalized
}
