import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from "bcryptjs"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding production essentials...")

  const adminEmail = "admin@guiazmg.com"
  const existing = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!existing) {
    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD env var is required for the production seed (no fallback password is allowed)")
    }
    const passwordHash = await bcrypt.hash(adminPassword, 12)
    await prisma.user.create({
      data: { name: "Admin Guía ZMG", email: adminEmail, passwordHash, role: "ADMIN", isActive: true },
    })
    console.log("Admin user created:", adminEmail)
  }

  // Los slugs DEBEN coincidir con src/lib/constants.ts (MEMBERSHIP_PLANS) y con
  // prisma/seed.ts: el checkout mete el slug en el externalReference del pago y
  // el webhook resuelve el plan por slug. Si divergen, un pago aprobado no
  // activa la membresía. Modelo oficial: 2 planes de pago (el acceso de prueba va
  // por cupones, no por tier gratuito).
  const plans = [
    { name: "Emprendimiento", slug: "emprendedor", description: "Para quien vende por su cuenta: catálogo y perfil para que te encuentren en tu zona.", monthlyPrice: 49, priorityLevel: 1, maxListings: 100, maxGalleryImages: 15, hasFeaturedBadge: false, hasSocialLinks: false, hasWebsiteLink: false },
    { name: "Negocio", slug: "negocio", description: "Para negocios y servicios establecidos: ficha completa, reseñas, estadísticas y mejor visibilidad.", monthlyPrice: 149, priorityLevel: 2, maxListings: 100, maxGalleryImages: 30, hasFeaturedBadge: true, hasSocialLinks: true, hasWebsiteLink: true },
  ]
  for (const plan of plans) {
    const p = await prisma.membershipPlan.findUnique({ where: { slug: plan.slug } })
    if (!p) {
      await prisma.membershipPlan.create({ data: plan })
      console.log("Plan created:", plan.name)
    }
  }

  console.log("Production seed completed")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
