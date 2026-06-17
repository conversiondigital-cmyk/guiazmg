import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const include = { _count: { select: { businesses: true } } } as const

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
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.slug !== undefined) data.slug = body.slug
    if (body.icon !== undefined) data.icon = body.icon || null
    if (body.isActive !== undefined) data.isActive = body.isActive

    const tag = await prisma.tag.update({ where: { id }, data, include })
    return NextResponse.json(tag)
  } catch (error) {
    console.error("[ADMIN_ETIQUETAS_PUT]", error)
    return NextResponse.json({ error: "Error al actualizar etiqueta" }, { status: 500 })
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
    await prisma.tag.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADMIN_ETIQUETAS_DELETE]", error)
    return NextResponse.json({ error: "Error al eliminar etiqueta" }, { status: 500 })
  }
}
