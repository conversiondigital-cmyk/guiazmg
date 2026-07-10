import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { businessSchema } from "@/lib/validations"
import { slugify, generateUniqueSlug } from "@/lib/utils"
import { createNotification } from "@/lib/notifications/create"
import { sendEmail } from "@/lib/email"
import { getPublicAppUrl } from "@/lib/env"
import { z } from "zod"

const blankToNull = (v: unknown) => (v === "" || v === undefined ? null : v)
const optText = (max: number) => z.preprocess(blankToNull, z.string().trim().max(max).nullable().optional())
const optUrl = z.preprocess(blankToNull, z.string().trim().url().max(500).nullable().optional())

// Campos que el DUEÑO puede editar (subconjunto seguro: texto libre y enlaces).
// Categoría, ubicación geo, estado y verificación NO se editan por aquí.
const businessUpdateSchema = z.object({
  name: z.string().trim().min(2).max(160).optional(),
  shortDescription: optText(200),
  description: optText(5000),
  phone: optText(30),
  whatsapp: optText(30),
  email: z.preprocess(blankToNull, z.string().trim().email().nullable().optional()),
  websiteUrl: optUrl,
  facebookUrl: optUrl,
  instagramUrl: optUrl,
  tiktokUrl: optUrl,
  youtubeUrl: optUrl,
  linkedinUrl: optUrl,
  addressText: optText(300),
  postalCode: optText(12),
  googleMapsUrl: optUrl,
  wazeUrl: optUrl,
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    // Regla: solo un negocio por usuario.
    const owned = await prisma.profile.findFirst({
      where: { ownerId: session.user.id, deletedAt: null },
      select: { id: true },
    })
    if (owned) {
      return NextResponse.json(
        { error: "Ya tienes un negocio registrado. Solo se permite uno por cuenta." },
        { status: 409 }
      )
    }

    const body = await request.json()
    const validation = businessSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const data = validation.data
    // Slug único legible (nombre, nombre-2, nombre-3…). Distintos dueños SÍ
    // pueden tener negocios con el mismo nombre; el slug los desambigua.
    const slug = await generateUniqueSlug(slugify(data.name), async (s) =>
      Boolean(await prisma.profile.findUnique({ where: { slug: s }, select: { id: true } }))
    )

    const business = await prisma.profile.create({
      data: {
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
        ownerId: session.user.id,
        // Entra a la cola de aprobación del admin.
        status: "PENDING_REVIEW",
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

    // Avisa a los administradores (notificación in-app + correo) que hay un
    // negocio nuevo por aprobar. Nunca rompe el registro si algo falla.
    try {
      const reviewUrl = `${getPublicAppUrl()}/admin/negocios/${business.id}`
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true, email: true },
      })
      await Promise.all(
        admins.map((a) =>
          createNotification({
            userId: a.id,
            type: "SYSTEM",
            title: "Nuevo negocio por aprobar",
            message: `${data.name} se registró y espera aprobación.`,
          })
        )
      )
      await Promise.allSettled(
        admins
          .filter((a) => a.email)
          .map((a) =>
            sendEmail(a.email, "business_registered", {
              businessName: data.name,
              ownerName: session.user?.name || "",
              reviewUrl,
            }, a.id)
          )
      )
    } catch (e) {
      console.error("[BUSINESS_REGISTER_NOTIFY]", e instanceof Error ? e.message : e)
    }

    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    console.error("[BUSINESS_CREATE]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear el negocio" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const businesses = await prisma.profile.findMany({
      where: { ownerId: session.user.id },
      include: {
        municipality: true,
        neighborhood: true,
        category: true,
        memberships: { include: { plan: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(businesses)
  } catch {
    return NextResponse.json({ error: "Error al obtener negocios" }, { status: 500 })
  }
}

// El dueño edita su propio negocio (relación 1:1 por ownerId).
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const business = await prisma.profile.findFirst({
      where: { ownerId: session.user.id, deletedAt: null },
      select: { id: true },
    })
    if (!business) {
      return NextResponse.json({ error: "No tienes un negocio registrado" }, { status: 404 })
    }

    const parsed = businessUpdateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
    }

    await prisma.profile.update({ where: { id: business.id }, data: parsed.data })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BUSINESS_UPDATE]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al actualizar el negocio" }, { status: 500 })
  }
}

// El dueño elimina su propio negocio (soft-delete: marca deletedAt; las queries
// públicas ya filtran deletedAt. Después puede registrar uno nuevo).
export async function DELETE() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const business = await prisma.profile.findFirst({
      where: { ownerId: session.user.id, deletedAt: null },
      select: { id: true },
    })
    if (!business) {
      return NextResponse.json({ error: "No tienes un negocio registrado" }, { status: 404 })
    }

    await prisma.profile.update({ where: { id: business.id }, data: { deletedAt: new Date() } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[BUSINESS_DELETE]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar el negocio" }, { status: 500 })
  }
}
