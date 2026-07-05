/**
 * Migración de datos (idempotente) al modelo de cobro de 2 planes.
 * Deja activos SOLO Emprendimiento (slug emprendedor) y Negocio; desactiva el resto
 * (Gratuito/Premium) sin borrarlos (seguro para FKs). Agrega el boost de 90 días.
 *
 *   npx tsx prisma/migrate-2b-plans.ts
 *
 * Correr en dev y, cuando se autorice, en prod (mismo script, DATABASE_URL de prod).
 */
import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) })

async function main() {
  const emprendimiento = {
    name: "Emprendimiento",
    description: "Para quien vende por su cuenta: catálogo y perfil para que te encuentren en tu zona.",
    monthlyPrice: 49, priorityLevel: 1, maxListings: 100, maxGalleryImages: 15,
    hasFeaturedBadge: false, hasSocialLinks: false, hasWebsiteLink: false, isActive: true,
  }
  const negocio = {
    name: "Negocio",
    description: "Para negocios y servicios establecidos: ficha completa, reseñas, estadísticas y mejor visibilidad.",
    monthlyPrice: 149, priorityLevel: 2, maxListings: 100, maxGalleryImages: 30,
    hasFeaturedBadge: true, hasSocialLinks: true, hasWebsiteLink: true, isActive: true,
  }

  await prisma.membershipPlan.upsert({ where: { slug: "emprendedor" }, update: emprendimiento, create: { slug: "emprendedor", ...emprendimiento } })
  await prisma.membershipPlan.upsert({ where: { slug: "negocio" }, update: negocio, create: { slug: "negocio", ...negocio } })

  const deact = await prisma.membershipPlan.updateMany({
    where: { slug: { notIn: ["emprendedor", "negocio"] } },
    data: { isActive: false },
  })

  const has90 = await prisma.boostDefinition.findFirst({ where: { durationDays: 90 } })
  if (!has90) await prisma.boostDefinition.create({ data: { name: "90 Días", durationDays: 90, price: 399, priorityBonus: 8 } })

  const plans = await prisma.membershipPlan.findMany({ orderBy: { monthlyPrice: "asc" } })
  console.log("planes:")
  for (const p of plans) console.log(`  ${p.slug.padEnd(12)} "${p.name}" $${Number(p.monthlyPrice)} active=${p.isActive}`)
  const boosts = await prisma.boostDefinition.findMany({ orderBy: { durationDays: "asc" } })
  console.log("boosts:", boosts.map((b) => `${b.durationDays}d/$${Number(b.price)}`).join(", "))
  console.log(`desactivados (gratuito/premium/otros): ${deact.count}`)
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
