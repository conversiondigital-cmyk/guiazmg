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
  BASIC: {
    name: "Básico",
    price: 149,
    ads: 3,
    features: ["Perfil", "WhatsApp", "3 anuncios", "Visibilidad básica"],
  },
  PROFESSIONAL: {
    name: "Profesional",
    price: 299,
    ads: 10,
    features: ["10 anuncios", "Redes sociales", "Sitio web", "Badge recomendado", "Mayor visibilidad"],
  },
  PREMIUM: {
    name: "Premium",
    price: 499,
    ads: 100,
    features: ["Anuncios ampliados", "Prioridad alta", "Badge premium", "Máxima visibilidad"],
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
