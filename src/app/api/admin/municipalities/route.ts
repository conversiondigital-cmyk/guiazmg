import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const municipalities = await prisma.municipality.findMany({
      include: {
        neighborhoods: { where: { isActive: true } },
        _count: { select: { neighborhoods: true, businesses: true } },
      },
      orderBy: { sortOrder: "asc" },
    })

    const total = municipalities.length
    const active = municipalities.filter((m) => m.isActive).length

    return NextResponse.json({ municipalities, stats: { total, active } })
  } catch (error) {
    console.error("[ADMIN_MUNICIPALITIES_GET]", error)
    return NextResponse.json({ error: "Error al obtener municipios" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, state, sortOrder, isActive } = body

    if (!name || !slug) {
      return NextResponse.json({ error: "Nombre y slug requeridos" }, { status: 400 })
    }

    const existing = await prisma.municipality.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 409 })
    }

    const municipality = await prisma.municipality.create({
      data: {
        name,
        slug,
        state: state ?? "Jalisco",
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
      include: {
        _count: { select: { neighborhoods: true, businesses: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "CREATE_MUNICIPALITY",
        entityType: "Municipality",
        entityId: municipality.id,
        newValue: JSON.stringify({ name, slug, state }),
      },
    })

    return NextResponse.json({ municipality }, { status: 201 })
  } catch (error) {
    console.error("[ADMIN_MUNICIPALITIES_POST]", error)
    return NextResponse.json({ error: "Error al crear municipio" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, slug, state, sortOrder, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (state !== undefined) data.state = state
    if (sortOrder !== undefined) data.sortOrder = sortOrder
    if (isActive !== undefined) data.isActive = isActive

    const municipality = await prisma.municipality.update({
      where: { id },
      data,
      include: {
        _count: { select: { neighborhoods: true, businesses: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "UPDATE_MUNICIPALITY",
        entityType: "Municipality",
        entityId: id,
        newValue: JSON.stringify(body),
      },
    })

    return NextResponse.json({ municipality })
  } catch (error) {
    console.error("[ADMIN_MUNICIPALITIES_PUT]", error)
    return NextResponse.json({ error: "Error al actualizar municipio" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { action, ids, id } = body

    if (action === "toggleActive" && id) {
      const municipality = await prisma.municipality.findUnique({ where: { id }, select: { isActive: true } })
      if (!municipality) {
        return NextResponse.json({ error: "Municipio no encontrado" }, { status: 404 })
      }
      await prisma.municipality.update({
        where: { id },
        data: { isActive: !municipality.isActive },
      })
      return NextResponse.json({ success: true, isActive: !municipality.isActive })
    }

    if (action === "reorder" && ids) {
      for (let i = 0; i < ids.length; i++) {
        await prisma.municipality.update({
          where: { id: ids[i] },
          data: { sortOrder: i },
        })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("[ADMIN_MUNICIPALITIES_PATCH]", error)
    return NextResponse.json({ error: "Error en operación" }, { status: 500 })
  }
}
