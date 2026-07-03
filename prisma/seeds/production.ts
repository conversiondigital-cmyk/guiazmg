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
  // activa la membresía. Se mantiene idéntico al set oficial de 4 planes.
  const plans = [
    { name: "Gratuito", slug: "gratuito", description: "Empieza a aparecer. Para emprendedores que apenas empiezan.", monthlyPrice: 0, priorityLevel: 0, maxListings: 10, maxGalleryImages: 3, hasFeaturedBadge: false, hasSocialLinks: false, hasWebsiteLink: false },
    { name: "Emprendedor", slug: "emprendedor", description: "Empieza a vender mejor. Para catálogos, ventas desde casa y servicios personales.", monthlyPrice: 49, priorityLevel: 1, maxListings: 100, maxGalleryImages: 15, hasFeaturedBadge: false, hasSocialLinks: true, hasWebsiteLink: false },
    { name: "Negocio", slug: "negocio", description: "Consigue más clientes. Para negocios y prestadores de servicios locales.", monthlyPrice: 149, priorityLevel: 2, maxListings: 100, maxGalleryImages: 30, hasFeaturedBadge: true, hasSocialLinks: true, hasWebsiteLink: true },
    { name: "Premium", slug: "premium", description: "Máxima exposición. Para negocios que buscan dominar búsquedas en su zona.", monthlyPrice: 299, priorityLevel: 3, maxListings: 200, maxGalleryImages: 50, hasFeaturedBadge: true, hasSocialLinks: true, hasWebsiteLink: true },
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
