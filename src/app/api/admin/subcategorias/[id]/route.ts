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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const { id } = await params
    const body = await request.json()
    const { name, slug, categoryId, description, sortOrder, isActive } = body

    const data: Record<string, unknown> = {}
    if (name !== undefined) data.name = name
    if (slug !== undefined) data.slug = slug
    if (categoryId !== undefined) data.categoryId = categoryId
    if (description !== undefined) data.description = description || null
    if (sortOrder !== undefined) data.sortOrder = sortOrder
    if (isActive !== undefined) data.isActive = isActive

    const subcategory = await prisma.subcategory.update({ where: { id }, data, include })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "UPDATE_SUBCATEGORY",
        entityType: "Subcategory",
        entityId: id,
        newValue: JSON.stringify(body),
      },
    })

    return NextResponse.json(subcategory)
  } catch (error) {
    console.error("[ADMIN_SUBCATEGORIAS_PUT]", error)
    return NextResponse.json({ error: "Error al actualizar subcategoría" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const { id } = await params
    await prisma.subcategory.delete({ where: { id } })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "DELETE_SUBCATEGORY",
        entityType: "Subcategory",
        entityId: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADMIN_SUBCATEGORIAS_DELETE]", error)
    return NextResponse.json({ error: "Error al eliminar subcategoría" }, { status: 500 })
  }
}
