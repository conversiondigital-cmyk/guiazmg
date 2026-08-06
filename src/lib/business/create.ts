import { prisma } from "@/lib/prisma"
import { slugify, generateUniqueSlug } from "@/lib/utils"
import { businessSchema } from "@/lib/validations"
import type { z } from "zod"

export type BusinessData = z.infer<typeof businessSchema>

// Error tipado para distinguir el nombre duplicado (409) de otros fallos.
export class BusinessCreateError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = "BusinessCreateError"
  }
}

// Crea el perfil de negocio para un usuario a partir de datos YA validados
// (businessSchema). Reutilizable por el alta inmediata (cupón) y por el webhook
// de pago (creación diferida). Valida nombre único, genera slug, crea el perfil y
// promueve el rol del dueño. NO envía notificaciones ni canjea cupones (eso queda
// del lado del llamador). `status` = PENDING_REVIEW (alta normal) o ACTIVE (pago).
export async function createBusinessForOwner(opts: {
  userId: string
  data: BusinessData
  status?: "PENDING_REVIEW" | "ACTIVE"
}): Promise<{ id: string; slug: string; name: string }> {
  const { userId, data, status = "PENDING_REVIEW" } = opts

  // Nombre único (sin distinguir mayúsculas/acentos, vía slug del nombre).
  const nameSlug = slugify(data.name)
  const dupName = await prisma.profile.findFirst({
    where: { slug: { equals: nameSlug }, deletedAt: null },
    select: { id: true },
  })
  if (dupName) {
    throw new BusinessCreateError(
      "DUPLICATE_NAME",
      "Ya existe un negocio con ese nombre. Si es una sucursal, contáctanos para agregarla.",
    )
  }

  const slug = await generateUniqueSlug(nameSlug, async (s) =>
    Boolean(await prisma.profile.findUnique({ where: { slug: s }, select: { id: true } })),
  )

  const business = await prisma.profile.create({
    data: {
      profileType: data.profileType ?? "NEGOCIO",
      hasPhysicalLocation: data.hasPhysicalLocation ?? data.profileType !== "EMPRENDEDOR",
      serviceModes: data.serviceModes ?? [],
      coverageArea: data.coverageArea || null,
      operationModel: data.operationModel || null,
      name: data.name,
      shortDescription: data.shortDescription,
      description: data.description,
      phone: data.phone,
      whatsapp: data.whatsapp,
      email: data.email,
      websiteUrl: data.websiteUrl,
      facebookUrl: data.facebookUrl,
      instagramUrl: data.instagramUrl,
      tiktokUrl: data.tiktokUrl,
      googleMapsUrl: data.googleMapsUrl,
      wazeUrl: data.wazeUrl,
      addressText: data.addressText,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
      categoryId: data.categoryId,
      subcategoryId: data.subcategoryId,
      municipalityId: data.municipalityId,
      neighborhoodId: data.neighborhoodId,
      slug,
      ownerId: userId,
      status,
      hours: data.hours
        ? {
            createMany: {
              data: data.hours.map((h) => ({
                dayOfWeek: h.dayOfWeek,
                opensAt: h.opensAt,
                closesAt: h.closesAt,
              })),
            },
          }
        : undefined,
    },
  })

  // Promueve al dueño a BUSINESS_OWNER si aún es USER.
  try {
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } })
    if (!current?.role || current.role === "USER") {
      await prisma.user.update({ where: { id: userId }, data: { role: "BUSINESS_OWNER" } })
    }
  } catch (e) {
    console.error("[BUSINESS_ROLE_PROMOTE]", e instanceof Error ? e.message : e)
  }

  return { id: business.id, slug: business.slug, name: business.name }
}
