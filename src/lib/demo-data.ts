import { prisma } from "@/lib/prisma"

type DemoBiz = {
  name: string
  slug: string
  shortDescription: string
  description: string
  phone: string
  whatsapp: string
  addressText: string
  status: "ACTIVE" | "PENDING_REVIEW"
}

// Negocios de demostración. Se marcan con isDemo=true y se eliminan por completo
// al deshabilitar; nunca se mezclan con los negocios reales.
const DEMO_BUSINESSES: DemoBiz[] = [
  {
    name: "Taquería El Primo",
    slug: "demo-taqueria-el-primo",
    shortDescription: "Tacos y tortas ahogadas al carbón",
    description: "Las mejores tortas ahogadas y tacos al pastor de la zona metropolitana, con más de 20 años de tradición.",
    phone: "+523312345678",
    whatsapp: "+523312345678",
    addressText: "Av. Vallarta 1234, Guadalajara",
    status: "ACTIVE",
  },
  {
    name: "DentalCare Zapopan",
    slug: "demo-dentalcare-zapopan",
    shortDescription: "Consultorio dental integral",
    description: "Consultorio dental con más de 10 años de experiencia: ortodoncia, implantes y odontología general.",
    phone: "+523398765432",
    whatsapp: "+523398765432",
    addressText: "Av. Patria 567, Zapopan",
    status: "ACTIVE",
  },
  {
    name: "Taller Mecánico El Bueno",
    slug: "demo-taller-mecanico-el-bueno",
    shortDescription: "Mecánica especializada europea",
    description: "Taller mecánico especializado en motores europeos, diagnóstico computarizado y servicio a domicilio.",
    phone: "+523355566677",
    whatsapp: "+523355566677",
    addressText: "Periférico Norte 890, Tlaquepaque",
    status: "ACTIVE",
  },
  {
    name: "Florería Las Rosas",
    slug: "demo-floreria-las-rosas",
    shortDescription: "Arreglos florales a domicilio",
    description: "Arreglos florales para toda ocasión con entrega a domicilio en toda la ZMG. Bodas, eventos y suscripciones.",
    phone: "+523311122233",
    whatsapp: "+523311122233",
    addressText: "Calle Hidalgo 45, Tonalá",
    status: "ACTIVE",
  },
  {
    name: "Café de la Esquina",
    slug: "demo-cafe-de-la-esquina",
    shortDescription: "Café de especialidad y repostería",
    description: "Café de especialidad tostado localmente, repostería artesanal y espacio para trabajar con wifi.",
    phone: "+523344455566",
    whatsapp: "+523344455566",
    addressText: "Av. México 2300, Guadalajara",
    status: "ACTIVE",
  },
  {
    name: "Gimnasio FuerzaTotal",
    slug: "demo-gimnasio-fuerzatotal",
    shortDescription: "Gimnasio y entrenamiento funcional",
    description: "Gimnasio con equipo de última generación, clases grupales y entrenadores certificados.",
    phone: "+523377788899",
    whatsapp: "+523377788899",
    addressText: "Av. López Mateos 1500, Zapopan",
    status: "PENDING_REVIEW",
  },
]

const DEMO_COORDS = { latitude: 20.6767, longitude: -103.3463 }

export async function getDemoDataStatus(): Promise<{ enabled: boolean; count: number }> {
  const count = await prisma.profile.count({ where: { isDemo: true } })
  return { enabled: count > 0, count }
}

export async function enableDemoData(): Promise<number> {
  const [categories, municipalities, admin] = await Promise.all([
    prisma.category.findMany({ where: { isActive: true }, take: 10 }),
    prisma.municipality.findMany({ take: 10 }),
    prisma.user.findFirst({ where: { role: "ADMIN" } }),
  ])

  if (categories.length === 0 || municipalities.length === 0 || !admin) {
    throw new Error(
      "Faltan datos base (categorías, municipios o un usuario admin). Corre el seed base antes de habilitar los datos demo."
    )
  }

  let created = 0
  for (let i = 0; i < DEMO_BUSINESSES.length; i++) {
    const biz = DEMO_BUSINESSES[i]
    const existing = await prisma.profile.findUnique({ where: { slug: biz.slug } })
    if (existing) continue

    const category = categories[i % categories.length]
    const municipality = municipalities[i % municipalities.length]
    const neighborhood = await prisma.neighborhood.findFirst({
      where: { municipalityId: municipality.id },
    })

    await prisma.profile.create({
      data: {
        name: biz.name,
        slug: biz.slug,
        shortDescription: biz.shortDescription,
        description: biz.description,
        phone: biz.phone,
        whatsapp: biz.whatsapp,
        addressText: biz.addressText,
        status: biz.status,
        isDemo: true,
        isVerified: true,
        verificationStatus: "VERIFIED",
        ownerId: admin.id,
        categoryId: category.id,
        municipalityId: municipality.id,
        neighborhoodId: neighborhood?.id ?? null,
        latitude: DEMO_COORDS.latitude,
        longitude: DEMO_COORDS.longitude,
      },
    })
    created++
  }

  return created
}

export async function disableDemoData(): Promise<number> {
  const result = await prisma.profile.deleteMany({ where: { isDemo: true } })
  return result.count
}
