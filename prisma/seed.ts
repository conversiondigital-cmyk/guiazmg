import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const MUNICIPALITIES = [
  { name: "Guadalajara", slug: "guadalajara" },
  { name: "Zapopan", slug: "zapopan" },
  { name: "Tlaquepaque", slug: "tlaquepaque" },
  { name: "Tonalá", slug: "tonala" },
  { name: "Tlajomulco", slug: "tlajomulco" },
  { name: "El Salto", slug: "el-salto" },
  { name: "Juanacatlán", slug: "juanacatlan" },
  { name: "Ixtlahuacán de los Membrillos", slug: "ixtlahuacan-de-los-membrillos" },
]

const CATEGORIES: { name: string; slug: string; icon: string; children: string[] }[] = [
  { name: "Salud", slug: "salud", icon: "🏥", children: ["Médicos", "Dentistas", "Veterinarias", "Farmacias", "Opticas", "Psicólogos"] },
  { name: "Alimentación", slug: "alimentacion", icon: "🍽️", children: ["Restaurantes", "Tacos", "Cafeterías", "Carnicerías", "Fruterías", "Pastelerías"] },
  { name: "Servicios", slug: "servicios", icon: "🔧", children: ["Cerrajeros", "Plomeros", "Electricistas", "Jardinería", "Limpieza", "Mecánicos"] },
  { name: "Compras", slug: "compras", icon: "🛍️", children: ["Tiendas", "Ropa", "Electrónica", "Muebles", "Regalos", "Mercados"] },
  { name: "Profesionales", slug: "profesionales", icon: "👔", children: ["Abogados", "Contadores", "Arquitectos", "Ingenieros", "Diseñadores", "Fotógrafos"] },
  { name: "Entretenimiento", slug: "entretenimiento", icon: "🎮", children: ["Cines", "Gimnasios", "Parques", "Bares", "Antros", "Eventos"] },
  { name: "Educación", slug: "educacion", icon: "📚", children: ["Escuelas", "Cursos", "Idiomas", "Tutorías", "Guarderías", "Bibliotecas"] },
  { name: "Hogar", slug: "hogar", icon: "🏠", children: ["Mantenimiento", "Mudanzas", "Decoración", "Seguridad", "Plomería", "Pintura"] },
  { name: "Automotriz", slug: "automotriz", icon: "🚗", children: ["Talleres", "Llanteras", "Lavados", "Refacciones", "Ventas", "Grúas"] },
  { name: "Belleza", slug: "belleza", icon: "💇", children: ["Salones", "Barberías", "Spas", "Uñas", "Maquillaje", "Depilación"] },
  { name: "Mascotas", slug: "mascotas", icon: "🐾", children: ["Veterinarias", "Paseadores", "Tiendas", "Estéticas", "Guarderías", "Adopciones"] },
  { name: "Construcción", slug: "construccion", icon: "🏗️", children: ["Arquitectos", "Ingenieros", "Materiales", "Remodelaciones", "Electricidad", "Pintura"] },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

async function main() {
  console.log("Iniciando seed...")

  const adminEmail = "baeltaezaer@gmail.com"
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash("admin123", 12)
    await prisma.user.create({
      data: {
        name: "Administrador",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    })
    console.log("Administrador creado:", adminEmail)
  }

  for (const m of MUNICIPALITIES) {
    const existing = await prisma.municipality.findUnique({ where: { slug: m.slug } })
    if (!existing) {
      await prisma.municipality.create({ data: { name: m.name, slug: m.slug } })
      console.log("Municipio creado:", m.name)
    }
  }

  for (const cat of CATEGORIES) {
    const existing = await prisma.category.findUnique({ where: { slug: cat.slug } })
    if (!existing) {
      const parent = await prisma.category.create({
        data: { name: cat.name, slug: cat.slug, icon: cat.icon },
      })
      for (const child of cat.children) {
        const childSlug = slugify(`${cat.slug}-${child}`)
        const existingChild = await prisma.subcategory.findFirst({ where: { slug: childSlug, categoryId: parent.id } })
        if (!existingChild) {
          await prisma.subcategory.create({
            data: { name: child, slug: childSlug, categoryId: parent.id },
          })
        }
      }
      console.log("Categoría creada:", cat.name)
    }
  }

  const neighborhoodsByMunicipio: Record<string, string[]> = {
    guadalajara: ["Americana", "Providencia", "Lafayette", "Chapalita", "Vallarta Poniente", "Arboledas", "Country Club", "Jardines del Bosque", "Prados Providencia", "Lomas del Country", "Colomos", "Monraz", "Bugambilias", "Villa Universitaria", "El Retiro"],
    zapopan: ["Parque Real", "Ciudad Granja", "Los Olivos", "Santa Isabel", "Las Águilas", "La Estancia", "Residencial Plaza", "Villa de las Flores", "Rinconada de los Sauces", "La Tuzanía", "El Fortín", "Los Cantaros", "Valle del Sol", "Aviación", "La Florida"],
    tlaquepaque: ["Centro", "Toluquilla", "San Pedrito", "La Calma", "Loma Dorada", "Las Conchas", "Independencia", "El Batan"],
    tonala: ["Centro", "La Paz", "Lomas de Tonalá", "Basilio Vadillo", "La Candelaria", "Pueblo Viejo"],
    tlajomulco: ["Chulavista", "Los Trigos", "Hacienda Santa Fe", "Real del Valle", "Villa Fontana", "Lomas de Tejeda", "Boulevares", "La Tijera"],
    "el-salto": ["Centro", "Las Pintas", "San José del Quince", "Las Paredes", "El Verde"],
    juanacatlan: ["Centro", "San Miguel", "Los Sauces", "La Aurora"],
    "ixtlahuacan-de-los-membrillos": ["Centro", "San Miguel", "Los Fresnos", "Las Palmas"],
  }

  for (const [municipioSlug, neighborhoods] of Object.entries(neighborhoodsByMunicipio)) {
    const municipio = await prisma.municipality.findUnique({ where: { slug: municipioSlug } })
    if (municipio) {
      for (const name of neighborhoods) {
        const slug = slugify(name)
        const existing = await prisma.neighborhood.findUnique({
          where: { municipalityId_slug: { municipalityId: municipio.id, slug } },
        })
        if (!existing) {
          await prisma.neighborhood.create({ data: { name, slug, municipalityId: municipio.id } })
        }
      }
      console.log(`Colonias de ${municipio.name} creadas`)
    }
  }

  const admin2Email = "admin@guiazmg.com"
  const existingAdmin2 = await prisma.user.findUnique({ where: { email: admin2Email } })
  if (!existingAdmin2) {
    const passwordHash = await bcrypt.hash("Admin123!", 12)
    await prisma.user.create({
      data: {
        name: "Admin Guía ZMG",
        email: admin2Email,
        passwordHash,
        role: "ADMIN",
        isActive: true,
      },
    })
    console.log("Administrador creado:", admin2Email)
  }

  // Planes de membresía oficiales — economía local ZMG
  const membershipPlans = [
    {
      name: "Gratuito",
      slug: "gratuito",
      description: "Empieza a aparecer. Para emprendedores que apenas empiezan.",
      monthlyPrice: 0,
      priorityLevel: 0,
      maxListings: 10,      // hasta 10 productos
      maxGalleryImages: 3,
      hasFeaturedBadge: false,
      hasSocialLinks: false,
      hasWebsiteLink: false,
    },
    {
      name: "Emprendedor",
      slug: "emprendedor",
      description: "Empieza a vender mejor. Para catálogos, ventas desde casa y servicios personales.",
      monthlyPrice: 49,
      priorityLevel: 1,
      maxListings: 100,     // hasta 100 productos / 20 servicios
      maxGalleryImages: 15,
      hasFeaturedBadge: false,
      hasSocialLinks: true,
      hasWebsiteLink: false,
    },
    {
      name: "Negocio",
      slug: "negocio",
      description: "Consigue más clientes. Para negocios y prestadores de servicios locales.",
      monthlyPrice: 149,
      priorityLevel: 2,
      maxListings: 100,     // hasta 100 productos y 100 servicios
      maxGalleryImages: 30,
      hasFeaturedBadge: true,
      hasSocialLinks: true,
      hasWebsiteLink: true,
    },
    {
      name: "Premium",
      slug: "premium",
      description: "Máxima exposición. Para negocios que buscan dominar búsquedas en su zona.",
      monthlyPrice: 299,
      priorityLevel: 3,
      maxListings: 200,
      maxGalleryImages: 50,
      hasFeaturedBadge: true,
      hasSocialLinks: true,
      hasWebsiteLink: true,
    },
  ]
  for (const plan of membershipPlans) {
    const existing = await prisma.membershipPlan.findUnique({ where: { slug: plan.slug } })
    if (!existing) {
      await prisma.membershipPlan.create({ data: plan })
      console.log("Plan de membresía creado:", plan.name)
    }
  }

  // Precios oficiales de boost — pago independiente a la membresía
  const boostDefinitions = [
    { name: "7 Días", durationDays: 7, price: 49, priorityBonus: 2 },
    { name: "15 Días", durationDays: 15, price: 99, priorityBonus: 3 },
    { name: "30 Días", durationDays: 30, price: 149, priorityBonus: 5 },
  ]
  for (const boost of boostDefinitions) {
    const existing = await prisma.boostDefinition.findFirst({ where: { name: boost.name } })
    if (!existing) {
      await prisma.boostDefinition.create({ data: boost })
      console.log("Definición de boost creada:", boost.name)
    }
  }

  const couponCode = "BIENVENIDO20"
  const existingCoupon = await prisma.promotionCoupon.findUnique({ where: { code: couponCode } })
  if (!existingCoupon) {
    await prisma.promotionCoupon.create({
      data: {
        code: couponCode,
        description: "20% de descuento en tu primera compra",
        discountType: "PERCENTAGE",
        discountValue: 20,
        minAmount: 99,
        maxUses: 1000,
        isActive: true,
      },
    })
    console.log("Cupón de promoción creado:", couponCode)
  }

  const badges = [
    { name: "Top Negocio", slug: "top-negocio", description: "Uno de los negocios más populares de la plataforma", icon: "Award", color: "#F59E0B", type: "BUSINESS" },
    { name: "Verificado", slug: "verificado", description: "Negocio verificado por Guía ZMG", icon: "BadgeCheck", color: "#3B82F6", type: "BUSINESS" },
    { name: "Premium", slug: "premium", description: "Negocio con membresía premium", icon: "Crown", color: "#8B5CF6", type: "BUSINESS" },
    { name: "Comerciante Destacado", slug: "comerciante-destacado", description: "Negocio destacado por calidad de servicio", icon: "Star", color: "#10B981", type: "BUSINESS" },
    { name: "Top Respuestas", slug: "top-respuestas", description: "Responde rápidamente a sus clientes", icon: "MessageCircle", color: "#EC4899", type: "BUSINESS" },
    { name: "Primer Negocio", slug: "primer-negocio", description: "Primer negocio registrado en la plataforma", icon: "Rocket", color: "#6366F1", type: "BUSINESS" },
    { name: "Miembro Antiguo", slug: "miembro-antiguo", description: "Más de 1 año en la plataforma", icon: "Clock", color: "#14B8A6", type: "BUSINESS" },
    { name: "Referidor Estrella", slug: "referidor-estrella", description: "Ha referido más de 5 negocios", icon: "Users", color: "#F97316", type: "USER" },
  ]
  for (const badge of badges) {
    const existing = await prisma.badge.findUnique({ where: { slug: badge.slug } })
    if (!existing) {
      await prisma.badge.create({ data: badge })
      console.log("Insignia creada:", badge.name)
    }
  }

  console.log("Seed completado exitosamente")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
