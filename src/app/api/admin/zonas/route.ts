import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { coerceZoneData } from "@/lib/admin-zones"

const zoneInclude = {
  municipality: { select: { id: true, name: true, slug: true } },
  _count: { select: { neighborhoods: true } },
} as const

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const data = coerceZoneData(body)

    if (!data.name || !data.slug || !data.municipalityId) {
      return NextResponse.json({ error: "Nombre, slug y municipio son obligatorios" }, { status: 400 })
    }

    const existing = await prisma.zone.findUnique({
      where: { municipalityId_slug: { municipalityId: data.municipalityId as string, slug: data.slug as string } },
      select: { id: true },
    })
    if (existing) {
      return NextResponse.json({ error: "Ya existe una zona con ese slug en el municipio" }, { status: 409 })
    }

    const zone = await prisma.zone.create({ data: data as any, include: zoneInclude })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "CREATE_ZONE",
        entityType: "Zone",
        entityId: zone.id,
        newValue: JSON.stringify({ name: zone.name, slug: zone.slug, municipalityId: zone.municipalityId }),
      },
    }).catch(() => {})

    revalidatePath(`/${zone.municipality.slug}/${zone.slug}`)
    revalidatePath(`/${zone.municipality.slug}`)

    // El CRUD genérico espera el item directamente.
    return NextResponse.json(zone, { status: 201 })
  } catch (error) {
    console.error("[ADMIN_ZONAS_POST]", error)
    return NextResponse.json({ error: "Error al crear la zona" }, { status: 500 })
  }
}
