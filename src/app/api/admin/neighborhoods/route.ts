import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const municipalityId = searchParams.get("municipalityId")
    const search = searchParams.get("search")?.trim()

    const where: Record<string, unknown> = {}

    if (municipalityId) {
      where.municipalityId = municipalityId
    }

    if (search) {
      where.name = { contains: search, mode: "insensitive" }
    }

    const neighborhoods = await prisma.neighborhood.findMany({
      where,
      include: {
        municipality: { select: { id: true, name: true } },
        _count: { select: { businesses: true } },
      },
      orderBy: { sortOrder: "asc" },
    })

    return NextResponse.json({ neighborhoods })
  } catch (error) {
    console.error("[ADMIN_NEIGHBORHOODS_GET]", error)
    return NextResponse.json({ error: "Error al obtener colonias" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { name, slug, municipalityId, postalCode, sortOrder, isActive } = body

    if (!name || !slug || !municipalityId) {
      return NextResponse.json({ error: "Nombre, slug y municipio requeridos" }, { status: 400 })
    }

    const existing = await prisma.neighborhood.findUnique({
      where: { municipalityId_slug: { municipalityId, slug } },
    })
    if (existing) {
      return NextResponse.json({ error: "La colonia ya existe en este municipio" }, { status: 409 })
    }

    const neighborhood = await prisma.neighborhood.create({
      data: {
        name,
        slug,
        municipalityId,
        postalCode,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
      include: {
        municipality: { select: { id: true, name: true } },
        _count: { select: { businesses: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "CREATE_NEIGHBORHOOD",
        entityType: "Neighborhood",
        entityId: neighborhood.id,
        newValue: JSON.stringify({ name, slug, municipalityId }),
      },
    })

    return NextResponse.json({ neighborhood }, { status: 201 })
  } catch (error) {
    console.error("[ADMIN_NEIGHBORHOODS_POST]", error)
    return NextResponse.json({ error: "Error al crear colonia" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, name, slug, municipalityId, postalCode, sortOrder, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (municipalityId !== undefined) data.municipalityId = municipalityId
    if (postalCode !== undefined) data.postalCode = postalCode
    if (sortOrder !== undefined) data.sortOrder = sortOrder
    if (isActive !== undefined) data.isActive = isActive

    const neighborhood = await prisma.neighborhood.update({
      where: { id },
      data,
      include: {
        municipality: { select: { id: true, name: true } },
        _count: { select: { businesses: true } },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "UPDATE_NEIGHBORHOOD",
        entityType: "Neighborhood",
        entityId: id,
        newValue: JSON.stringify(body),
      },
    })

    return NextResponse.json({ neighborhood })
  } catch (error) {
    console.error("[ADMIN_NEIGHBORHOODS_PUT]", error)
    return NextResponse.json({ error: "Error al actualizar colonia" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { action, id } = body

    if (action === "toggleActive" && id) {
      const neighborhood = await prisma.neighborhood.findUnique({ where: { id }, select: { isActive: true } })
      if (!neighborhood) {
        return NextResponse.json({ error: "Colonia no encontrada" }, { status: 404 })
      }
      await prisma.neighborhood.update({
        where: { id },
        data: { isActive: !neighborhood.isActive },
      })
      return NextResponse.json({ success: true, isActive: !neighborhood.isActive })
    }

    if (action === "import") {
      const { rows } = body
      if (!Array.isArray(rows) || rows.length === 0) {
        return NextResponse.json({ error: "Filas requeridas" }, { status: 400 })
      }

      const municipalities = await prisma.municipality.findMany({
        select: { id: true, name: true },
      })
      const munMap = new Map(municipalities.map((m) => [m.name.toLowerCase(), m.id]))

      let created = 0
      let failed = 0
      const errors: string[] = []

      for (const row of rows) {
        const munName = String(row.municipio || "").trim().toLowerCase()
        const colName = String(row.colonia || "").trim()
        const cp = String(row.codigo_postal || "").trim() || undefined

        if (!munName || !colName) {
          failed++
          errors.push(`Fila inválida: ${JSON.stringify(row)}`)
          continue
        }

        const munId = munMap.get(munName)
        if (!munId) {
          failed++
          errors.push(`Municipio no encontrado: "${row.municipio}"`)
          continue
        }

        const slug = colName
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")

        try {
          await prisma.neighborhood.upsert({
            where: { municipalityId_slug: { municipalityId: munId, slug } },
            create: { name: colName, slug, municipalityId: munId, postalCode: cp },
            update: { postalCode: cp },
          })
          created++
        } catch {
          failed++
          errors.push(`Error al crear "${colName}" en "${row.municipio}"`)
        }
      }

      await prisma.importJob.create({
        data: {
          type: "MUNICIPALITIES",
          fileName: "import.csv",
          status: failed > 0 ? "COMPLETED" : "COMPLETED",
          processedRows: created,
          failedRows: failed,
        },
      })

      return NextResponse.json({ success: true, created, failed, errors })
    }

    return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
  } catch (error) {
    console.error("[ADMIN_NEIGHBORHOODS_PATCH]", error)
    return NextResponse.json({ error: "Error en operación" }, { status: 500 })
  }
}
