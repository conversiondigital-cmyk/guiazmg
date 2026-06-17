import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { businessSchema } from "@/lib/validations"
import { slugify } from "@/lib/utils"
import { createNotification } from "@/lib/notifications/create"
import { sendEmail } from "@/lib/email"
import { getPublicAppUrl } from "@/lib/env"

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
    const slug = slugify(data.name)

    const existing = await prisma.profile.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un negocio con ese nombre" },
        { status: 409 }
      )
    }

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
        latitude: data.latitude,
        longitude: data.longitude,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        municipalityId: data.municipalityId,
        neighborhoodId: data.neighborhoodId,
        slug: `${slug}-${Date.now()}`,
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
  } catch {
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
