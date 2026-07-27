import { NextRequest, NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { coerceZoneData } from "@/lib/admin-zones"

const zoneInclude = {
  municipality: { select: { id: true, name: true, slug: true } },
  _count: { select: { neighborhoods: true } },
} as const

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const { id } = await params
    const body = await request.json()
    const data = coerceZoneData(body)

    // Si cambia slug/municipio, evita colisión con otra zona.
    if (data.slug || data.municipalityId) {
      const current = await prisma.zone.findUnique({ where: { id }, select: { slug: true, municipalityId: true } })
      if (!current) return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 })
      const slug = (data.slug as string) ?? current.slug
      const municipalityId = (data.municipalityId as string) ?? current.municipalityId
      const clash = await prisma.zone.findUnique({
        where: { municipalityId_slug: { municipalityId, slug } },
        select: { id: true },
      })
      if (clash && clash.id !== id) {
        return NextResponse.json({ error: "Ya existe una zona con ese slug en el municipio" }, { status: 409 })
      }
    }

    const zone = await prisma.zone.update({ where: { id }, data: data as any, include: zoneInclude })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "UPDATE_ZONE",
        entityType: "Zone",
        entityId: id,
        newValue: JSON.stringify(data),
      },
    }).catch(() => {})

    revalidatePath(`/${zone.municipality.slug}/${zone.slug}`)
    revalidatePath(`/${zone.municipality.slug}`)

    return NextResponse.json(zone)
  } catch (error) {
    console.error("[ADMIN_ZONAS_PUT]", error)
    return NextResponse.json({ error: "Error al actualizar la zona" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const { id } = await params

    // Las colonias enlazadas quedan con zoneId = null (onDelete: SetNull).
    const zone = await prisma.zone.findUnique({
      where: { id },
      select: { slug: true, municipality: { select: { slug: true } } },
    })
    if (!zone) return NextResponse.json({ error: "Zona no encontrada" }, { status: 404 })

    await prisma.zone.delete({ where: { id } })

    await prisma.auditLog.create({
      data: { actorUserId: session.user.id, action: "DELETE_ZONE", entityType: "Zone", entityId: id },
    }).catch(() => {})

    revalidatePath(`/${zone.municipality.slug}/${zone.slug}`)
    revalidatePath(`/${zone.municipality.slug}`)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADMIN_ZONAS_DELETE]", error)
    return NextResponse.json({ error: "Error al eliminar la zona" }, { status: 500 })
  }
}
