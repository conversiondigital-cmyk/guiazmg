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
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD || "Admin123!", 12)
    await prisma.user.create({
      data: { name: "Admin Guía ZMG", email: adminEmail, passwordHash, role: "ADMIN", isActive: true },
    })
    console.log("Admin user created:", adminEmail)
  }

  const plans = [
    { name: "Básico", slug: "basico", description: "Plan básico para negocios locales", monthlyPrice: 149, priorityLevel: 0, maxListings: 3, maxGalleryImages: 5, hasFeaturedBadge: false, hasSocialLinks: false, hasWebsiteLink: false },
    { name: "Profesional", slug: "profesional", description: "Plan profesional con mayor visibilidad", monthlyPrice: 299, priorityLevel: 1, maxListings: 10, maxGalleryImages: 15, hasFeaturedBadge: true, hasSocialLinks: true, hasWebsiteLink: true },
    { name: "Premium", slug: "premium", description: "Plan premium con máxima exposición", monthlyPrice: 499, priorityLevel: 2, maxListings: 25, maxGalleryImages: 30, hasFeaturedBadge: true, hasSocialLinks: true, hasWebsiteLink: true },
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
