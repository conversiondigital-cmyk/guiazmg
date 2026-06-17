// Las 20 categorías de los negocios demo. Se upsertan al habilitar el demo.
// color1/color2 = gradiente de marca; emoji = ícono para las imágenes SVG.
export type DemoCategory = {
  slug: string
  name: string
  emoji: string
  color1: string
  color2: string
}

export const DEMO_CATEGORIES: DemoCategory[] = [
  { slug: "restaurantes", name: "Restaurantes", emoji: "🍽️", color1: "#7f1d1d", color2: "#ef4444" },
  { slug: "cafeterias", name: "Cafeterías", emoji: "☕", color1: "#78350f", color2: "#d97706" },
  { slug: "salud", name: "Salud", emoji: "🩺", color1: "#0c4a6e", color2: "#0891b2" },
  { slug: "belleza", name: "Belleza y Estética", emoji: "💅", color1: "#831843", color2: "#ec4899" },
  { slug: "automotriz", name: "Automotriz", emoji: "🚗", color1: "#1e3a8a", color2: "#3b82f6" },
  { slug: "gimnasios", name: "Gimnasios y Fitness", emoji: "🏋️", color1: "#14532d", color2: "#22c55e" },
  { slug: "educacion", name: "Educación", emoji: "🎓", color1: "#312e81", color2: "#6366f1" },
  { slug: "mascotas", name: "Mascotas", emoji: "🐾", color1: "#7c2d12", color2: "#f97316" },
  { slug: "hogar", name: "Hogar y Muebles", emoji: "🛋️", color1: "#713f12", color2: "#ca8a04" },
  { slug: "construccion", name: "Construcción", emoji: "🏗️", color1: "#1f2937", color2: "#f59e0b" },
  { slug: "tecnologia", name: "Tecnología", emoji: "💻", color1: "#0f172a", color2: "#0ea5e9" },
  { slug: "inmobiliaria", name: "Inmobiliaria", emoji: "🏠", color1: "#064e3b", color2: "#10b981" },
  { slug: "entretenimiento", name: "Entretenimiento", emoji: "🎉", color1: "#581c87", color2: "#a855f7" },
  { slug: "profesionales", name: "Servicios Profesionales", emoji: "💼", color1: "#1e293b", color2: "#64748b" },
  { slug: "moda", name: "Moda y Ropa", emoji: "👗", color1: "#831843", color2: "#f472b6" },
  { slug: "eventos", name: "Eventos y Banquetes", emoji: "🥂", color1: "#4a044e", color2: "#c026d3" },
  { slug: "turismo", name: "Hoteles y Turismo", emoji: "🏨", color1: "#082f49", color2: "#0284c7" },
  { slug: "servicios", name: "Servicios para el Hogar", emoji: "🔧", color1: "#1c1917", color2: "#78716c" },
  { slug: "compras", name: "Compras y Abarrotes", emoji: "🛒", color1: "#14532d", color2: "#4ade80" },
  { slug: "florerias", name: "Florerías y Regalos", emoji: "💐", color1: "#881337", color2: "#fb7185" },
]

export const DEMO_CATEGORY_BY_SLUG: Record<string, DemoCategory> = Object.fromEntries(
  DEMO_CATEGORIES.map((c) => [c.slug, c])
)
