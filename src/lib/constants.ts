export const MUNICIPALITIES = [
  { name: "Guadalajara", slug: "guadalajara" },
  { name: "Zapopan", slug: "zapopan" },
  { name: "Tlaquepaque", slug: "tlaquepaque" },
  { name: "Tonalá", slug: "tonala" },
  { name: "Tlajomulco", slug: "tlajomulco" },
  { name: "El Salto", slug: "el-salto" },
  { name: "Juanacatlán", slug: "juanacatlan" },
  { name: "Ixtlahuacán de los Membrillos", slug: "ixtlahuacan-de-los-membrillos" },
] as const

// Modelo de cobro oficial: 2 planes de pago + boost. No hay tier gratuito (el
// acceso de prueba se da con cupones canjeables, ver MembershipCoupon).
export const MEMBERSHIP_PLANS = {
  EMPRENDIMIENTO: {
    name: "Emprendimiento",
    price: 49,
    // El slug interno se mantiene "emprendedor" a propósito: el webhook de pagos y
    // las suscripciones existentes resuelven por slug. Solo cambió el nombre visible.
    slug: "emprendedor",
    tagline: "Para quien vende por su cuenta",
    features: [
      "1 perfil comercial",
      "Catálogo de hasta 100 productos",
      "Hasta 20 servicios",
      "Hasta 3 promociones activas",
      "WhatsApp, teléfono y ubicación",
      "Galería básica",
      "Métricas básicas (vistas y clics)",
      "Puedes comprar boost",
    ],
  },
  NEGOCIO: {
    name: "Negocio",
    price: 149,
    slug: "negocio",
    tagline: "Para negocios y servicios establecidos",
    features: [
      "Perfil comercial completo",
      "Hasta 100 productos y 100 servicios",
      "Hasta 10 promociones activas",
      "Dirección, horarios, cobertura, redes y sitio web",
      "Galería ampliada",
      "Reseñas habilitadas",
      "Estadísticas completas + leads",
      "Posibilidad de verificación",
      "Mejor posicionamiento + boost",
    ],
  },
} as const

// Paquetes de boost (aparecer más arriba por un tiempo). Pago único por duración,
// sin créditos ni saldo interno.
export const BOOSTS = [
  { name: "Semanal", days: 7, price: 49 },
  { name: "Quincenal", days: 15, price: 99 },
  { name: "Mensual", days: 30, price: 149 },
  { name: "Trimestral", days: 90, price: 399 },
] as const

// Resuelve un plan por su slug — que es lo que viaja en las URLs (/checkout?plan=)
// y en el externalReference del webhook. Antes el checkout indexaba por KEY
// (mayúsculas) mientras las URLs pasan el slug (minúsculas) → "Plan inválido".
export function getPlanBySlug(slug: string | null | undefined) {
  if (!slug) return null
  return Object.values(MEMBERSHIP_PLANS).find((p) => p.slug === slug) ?? null
}

export const SEARCH_SUGGESTIONS = [
  "cerrajero",
  "dentista",
  "tacos",
  "plomero",
  "veterinaria",
  "mecánico",
  "llantera",
  "restaurante",
  "médico",
  "abogado",
  "contador",
  "arquitecto",
  "electricista",
  "jardinería",
  "gimnasio",
  "taller",
]

export const METRIC_TYPES = ["whatsapp", "phone", "website", "maps", "facebook", "instagram", "tiktok", "view"] as const
