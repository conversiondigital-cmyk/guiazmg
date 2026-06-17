import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const include = {
  category: { select: { name: true } },
  _count: { select: { businesses: true } },
} as const

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const subcategories = await prisma.subcategory.findMany({
    include,
    orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
  })
  return NextResponse.json(subcategories)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const body = await request.json()
    const { name, slug, categoryId, description, sortOrder, isActive } = body

    if (!name || !slug || !categoryId) {
      return NextResponse.json({ error: "Nombre, slug y categoría son requeridos" }, { status: 400 })
    }

    const existing = await prisma.subcategory.findUnique({
      where: { categoryId_slug: { categoryId, slug } },
    })
    if (existing) {
      return NextResponse.json({ error: "El slug ya existe en esta categoría" }, { status: 409 })
    }

    const subcategory = await prisma.subcategory.create({
      data: {
        name,
        slug,
        categoryId,
        description: description || null,
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
      include,
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "CREATE_SUBCATEGORY",
        entityType: "Subcategory",
        entityId: subcategory.id,
        newValue: JSON.stringify({ name, slug, categoryId }),
      },
    })

    return NextResponse.json(subcategory, { status: 201 })
  } catch (error) {
    console.error("[ADMIN_SUBCATEGORIAS_POST]", error)
    return NextResponse.json({ error: "Error al crear subcategoría" }, { status: 500 })
  }
}
