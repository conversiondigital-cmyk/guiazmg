import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log("Seeding demo data...")

  const municipio = await prisma.municipality.findFirst()
  if (!municipio) {
    console.log("No municipalities found. Run seed:base first.")
    return
  }

  const category = await prisma.category.findFirst()
  if (!category) {
    console.log("No categories found. Run seed:base first.")
    return
  }

  const subcategory = await prisma.subcategory.findFirst()
  const neighborhood = await prisma.neighborhood.findFirst()

  const admin = await prisma.user.findFirst({ where: { role: "ADMIN" } })
  if (!admin) {
    console.log("No admin found. Run seed:base first.")
    return
  }

  const demoBusinesses = [
    {
      name: "Taquería El Primo",
      slug: "tacqueria-el-primo",
      description: "Las mejores tortas y tacos de la zona metropolitana",
      phone: "+523312345678",
      address: "Av. Vallarta 1234",
      status: "ACTIVE" as const,
    },
    {
      name: "DentalCare Zapopan",
      slug: "dentalcare-zapopan",
      description: "Consultorio dental con más de 10 años de experiencia",
      phone: "+523398765432",
      address: "Av. Patria 567",
      status: "ACTIVE" as const,
    },
    {
      name: "Taller Mecánico El Bueno",
      slug: "taller-mecanico-el-bueno",
      description: "Taller mecánico especializado en motores europeos",
      phone: "+5233555666777",
      address: "Periférico Norte 890",
      status: "PENDING_REVIEW" as const,
    },
  ]

  for (const biz of demoBusinesses) {
    const existing = await prisma.profile.findUnique({ where: { slug: biz.slug } })
    if (existing) continue

    const business = await prisma.profile.create({
      data: {
        ...biz,
        ownerId: admin.id,
        municipalityId: municipio.id,
        categoryId: category.id,
        subcategoryId: subcategory?.id ?? null,
        neighborhoodId: neighborhood?.id ?? null,
        latitude: 20.6767,
        longitude: -103.3463,
        isVerified: true,
        verificationStatus: "VERIFIED",
        searchVector: biz.name,
      },
    })

    console.log(`Demo business created: ${business.name}`)
  }

  console.log("Demo seed completed successfully")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
