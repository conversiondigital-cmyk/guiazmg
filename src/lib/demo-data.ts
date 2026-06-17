import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { DEMO_CATEGORIES } from "@/lib/demo/demo-categories"
import demoData from "@/lib/demo/demo-businesses.json"

// Negocios demo. Las IMÁGENES viven en public/demo/<slug>/ (no en la BD); la
// BD solo guarda las rutas /demo/<slug>/*.svg. Se marcan con isDemo=true y se
// eliminan por completo al deshabilitar; nunca se mezclan con los reales.

type DemoBusiness = {
  name: string
  slug: string
  shortDescription: string
  description: string
  phone: string
  whatsapp: string
  email: string
  websiteUrl: string
  facebookUrl: string
  instagramUrl: string
  tiktokUrl: string | null
  googleMapsUrl: string
  wazeUrl: string
  addressText: string
  postalCode: string
  latitude: number
  longitude: number
  municipality: string
  neighborhood: string
  profileType: "NEGOCIO" | "EMPRENDEDOR"
  isVerified: boolean
  isFeatured: boolean
  promoTitle: string | null
  promoCode: string | null
  categorySlug: string
}

const DEMO_BUSINESSES = demoData as unknown as DemoBusiness[]

// Lun-Sáb 9-19, Dom cerrado. (dayOfWeek: 0=Dom ... 6=Sáb)
const DEMO_HOURS = [0, 1, 2, 3, 4, 5, 6].map((d) => ({
  dayOfWeek: d,
  isClosed: d === 0,
  opensAt: d === 0 ? null : "09:00",
  closesAt: d === 0 ? null : d === 6 ? "15:00" : "19:00",
}))

export async function getDemoDataStatus(): Promise<{ enabled: boolean; count: number }> {
  const count = await prisma.profile.count({ where: { isDemo: true } })
  return { enabled: count > 0, count }
}

export async function enableDemoData(): Promise<number> {
  const admin = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    orderBy: { createdAt: "asc" },
  })
  if (!admin) {
    throw new Error("No hay un usuario admin. Corre el seed base antes de habilitar los datos demo.")
  }

  // Empezamos limpio para garantizar exactamente el set demo actual.
  await prisma.profile.deleteMany({ where: { isDemo: true } })

  // 1) Asegurar las 20 categorías (idempotente).
  const catIdBySlug = new Map<string, string>()
  for (let i = 0; i < DEMO_CATEGORIES.length; i++) {
    const c = DEMO_CATEGORIES[i]
    const cat = await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.emoji, isActive: true },
      create: { slug: c.slug, name: c.name, icon: c.emoji, isActive: true, sortOrder: i },
    })
    catIdBySlug.set(c.slug, cat.id)
  }

  // 2) Mapa de municipios por nombre.
  const munis = await prisma.municipality.findMany({ select: { id: true, name: true } })
  const muniIdByName = new Map(munis.map((m) => [m.name, m.id]))

  const now = new Date()
  const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)

  let created = 0
  for (const biz of DEMO_BUSINESSES) {
    const categoryId = catIdBySlug.get(biz.categorySlug) ?? null
    const municipalityId = muniIdByName.get(biz.municipality) ?? null

    // Colonia: buscar; si no existe en ese municipio, crearla.
    let neighborhoodId: string | null = null
    if (municipalityId) {
      let nb = await prisma.neighborhood.findFirst({
        where: { municipalityId, name: biz.neighborhood },
        select: { id: true },
      })
      if (!nb) {
        nb = await prisma.neighborhood
          .create({
            data: {
              name: biz.neighborhood,
              slug: slugify(`${biz.neighborhood}-${biz.municipality}`),
              municipalityId,
              isActive: true,
            },
            select: { id: true },
          })
          .catch(() => null)
      }
      neighborhoodId = nb?.id ?? null
    }

    const base = `/demo/${biz.slug}`

    await prisma.profile.create({
      data: {
        name: biz.name,
        slug: biz.slug,
        shortDescription: biz.shortDescription,
        description: biz.description,
        phone: biz.phone,
        whatsapp: biz.whatsapp,
        email: biz.email,
        websiteUrl: biz.websiteUrl,
        facebookUrl: biz.facebookUrl,
        instagramUrl: biz.instagramUrl,
        tiktokUrl: biz.tiktokUrl,
        googleMapsUrl: biz.googleMapsUrl,
        wazeUrl: biz.wazeUrl,
        addressText: biz.addressText,
        postalCode: biz.postalCode,
        latitude: biz.latitude,
        longitude: biz.longitude,
        logoUrl: `${base}/logo.svg`,
        coverImageUrl: `${base}/cover.svg`,
        profileType: biz.profileType,
        status: "ACTIVE",
        isActive: true,
        isDemo: true,
        isVerified: biz.isVerified,
        verificationStatus: biz.isVerified ? "VERIFIED" : "UNVERIFIED",
        isFeatured: biz.isFeatured,
        ownerId: admin.id,
        categoryId,
        municipalityId,
        neighborhoodId,
        images: {
          create: [1, 2, 3].map((n) => ({ imageUrl: `${base}/g${n}.svg`, sortOrder: n - 1 })),
        },
        hours: { create: DEMO_HOURS },
        coupons: biz.promoTitle
          ? {
              create: [
                {
                  title: biz.promoTitle,
                  code: biz.promoCode,
                  isActive: true,
                  startDate: now,
                  endDate: in90,
                },
              ],
            }
          : undefined,
      },
    })
    created++
  }

  return created
}

export async function disableDemoData(): Promise<number> {
  // El borrado en cascada elimina imágenes, horarios y cupones demo.
  const result = await prisma.profile.deleteMany({ where: { isDemo: true } })
  return result.count
}
