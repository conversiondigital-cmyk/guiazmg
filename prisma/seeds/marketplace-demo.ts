import "dotenv/config"
import { PrismaClient } from "../../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

/**
 * Seed de DESARROLLO del marketplace.
 *
 * Por qué existe: las categorías del marketplace no están en ningún seed —
 * en producción las crea un administrador desde el panel. En un entorno
 * local recién levantado eso deja la pestaña Marketplace completamente
 * vacía, así que no se puede desarrollar ni verificar contra ella.
 *
 * Los nombres y emojis replican los del sitio (ver CATEGORY_ICONS en
 * src/app/marketplace/page.tsx) para que la app móvil y la web muestren lo
 * mismo.
 *
 * ⚠️ Es DEMO: los anuncios que crea son inventados y quedan marcados como
 * tales en su descripción. No correr contra producción.
 */

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const CATEGORIES = [
  { name: "Productos", slug: "productos", icon: "📦" },
  { name: "Servicios", slug: "servicios", icon: "🔧" },
  { name: "Empleos", slug: "empleos", icon: "💼" },
  { name: "Mascotas", slug: "mascotas", icon: "🐾" },
  { name: "Vehículos", slug: "vehiculos", icon: "🚗" },
  { name: "Inmuebles", slug: "inmuebles", icon: "🏠" },
  { name: "Eventos", slug: "eventos", icon: "🎉" },
  { name: "Comida", slug: "comida", icon: "🍕" },
  { name: "Clases", slug: "clases", icon: "📚" },
  { name: "Comunidad", slug: "comunidad", icon: "👥" },
]

const LISTINGS = [
  { title: "Bicicleta de montaña rodada 29", price: 4500, cat: "productos", cond: "USED", neighborhood: "Providencia" },
  { title: "Servicio de plomería a domicilio", price: 350, cat: "servicios", cond: null, neighborhood: "Chapalita" },
  { title: "Vendo Nissan Versa 2019", price: 189000, cat: "vehiculos", cond: "USED", neighborhood: "Andares" },
  { title: "Cachorros labrador con vacunas", price: 3500, cat: "mascotas", cond: null, neighborhood: "Tlaquepaque Centro" },
  { title: "Departamento en renta 2 recámaras", price: 12000, cat: "inmuebles", cond: null, neighborhood: "Americana" },
  { title: "Clases de guitarra para principiantes", price: 250, cat: "clases", cond: null, neighborhood: "Zapopan Centro" },
  { title: "Pastel de tres leches por encargo", price: 480, cat: "comida", cond: null, neighborhood: "Santa Tere" },
  { title: "Laptop Dell i5 8GB RAM", price: 7200, cat: "productos", cond: "LIKE_NEW", neighborhood: "Ciudad del Sol" },
]

async function main() {
  console.log("Sembrando datos de DEMOSTRACIÓN del marketplace...")

  const municipio = await prisma.municipality.findFirst()
  const owner = await prisma.user.findFirst({ where: { role: "ADMIN" } })

  if (!municipio || !owner) {
    console.log("Falta municipio o usuario admin. Corre primero `npm run seed:base`.")
    return
  }

  const bySlug = new Map<string, string>()

  for (const [i, c] of CATEGORIES.entries()) {
    const cat = await prisma.marketplaceCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon, sortOrder: i, isActive: true },
      create: { name: c.name, slug: c.slug, icon: c.icon, sortOrder: i, isActive: true },
    })
    bySlug.set(c.slug, cat.id)
  }
  console.log(`Categorías del marketplace: ${CATEGORIES.length}`)

  // Los anuncios expiran a 30 días, igual que en producción (el cron
  // marketplace-expire los pasa a EXPIRED al vencer).
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  let created = 0
  for (const l of LISTINGS) {
    const categoryId = bySlug.get(l.cat)
    if (!categoryId) continue

    const slug = l.title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const existing = await prisma.marketplaceListing.findUnique({ where: { slug } })
    if (existing) continue

    await prisma.marketplaceListing.create({
      data: {
        title: l.title,
        slug,
        description: `Publicación de DEMOSTRACIÓN para desarrollo local. ${l.title}.`,
        price: l.price,
        type: "SALE",
        condition: l.cond,
        status: "ACTIVE",
        categoryId,
        userId: owner.id,
        municipalityId: municipio.id,
        neighborhood: l.neighborhood,
        phone: "3300000000",
        whatsapp: "3300000000",
        expiresAt,
      },
    })
    created++
  }

  console.log(`Anuncios creados: ${created}`)
  console.log("Seed de marketplace completado.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
