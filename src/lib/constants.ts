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

export const MEMBERSHIP_PLANS = {
  GRATUITO: {
    name: "Gratuito",
    price: 0,
    slug: "gratuito",
    tagline: "Empieza a aparecer",
    features: [
      "1 perfil comercial",
      "Hasta 10 productos",
      "1 promoción activa",
      "Botón de WhatsApp",
      "Botón de llamada",
      "Acceso básico al marketplace",
    ],
  },
  EMPRENDEDOR: {
    name: "Emprendedor",
    price: 49,
    slug: "emprendedor",
    tagline: "Empieza a vender mejor",
    features: [
      "1 perfil comercial",
      "Hasta 100 productos",
      "Hasta 20 servicios",
      "Hasta 3 promociones activas",
      "Galería ampliada",
      "Métricas básicas (vistas, clics)",
      "Mejor posicionamiento que Gratuito",
    ],
  },
  NEGOCIO: {
    name: "Negocio",
    price: 149,
    slug: "negocio",
    tagline: "Consigue más clientes",
    features: [
      "1 perfil comercial robusto",
      "Hasta 100 productos",
      "Hasta 100 servicios",
      "Hasta 10 promociones activas",
      "Estadísticas completas",
      "Reseñas habilitadas",
      "Posibilidad de verificación",
      "Horarios, cobertura, redes sociales",
      "Mejor posicionamiento que Emprendedor",
    ],
  },
  PREMIUM: {
    name: "Premium",
    price: 299,
    slug: "premium",
    tagline: "Aparece primero",
    features: [
      "Todo lo de Negocio",
      "Hasta 200 productos y servicios",
      "Insignia premium visible",
      "Máxima prioridad en búsquedas",
      "Métricas avanzadas",
      "Soporte prioritario",
    ],
  },
} as const

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
