import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { businessSchema } from "@/lib/validations"
import { slugify } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
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

    const existing = await prisma.business.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe un negocio con ese nombre" },
        { status: 409 }
      )
    }

    const business = await prisma.business.create({
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
        status: "DRAFT",
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

    const businesses = await prisma.business.findMany({
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
