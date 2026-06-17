import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"

const include = { _count: { select: { businesses: true } } } as const

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const tags = await prisma.tag.findMany({ include, orderBy: { name: "asc" } })
  return NextResponse.json(tags)
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const body = await request.json()
    const name = (body.name ?? "").trim()
    const slug = (body.slug ?? "").trim() || slugify(name)

    if (!name || !slug) {
      return NextResponse.json({ error: "Nombre requerido" }, { status: 400 })
    }

    const existing = await prisma.tag.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "El slug ya existe" }, { status: 409 })
    }

    const tag = await prisma.tag.create({
      data: {
        name,
        slug,
        icon: body.icon || null,
        isActive: body.isActive ?? true,
      },
      include,
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "CREATE_TAG",
        entityType: "Tag",
        entityId: tag.id,
        newValue: JSON.stringify({ name, slug }),
      },
    })

    return NextResponse.json(tag, { status: 201 })
  } catch (error) {
    console.error("[ADMIN_ETIQUETAS_POST]", error)
    return NextResponse.json({ error: "Error al crear etiqueta" }, { status: 500 })
  }
}
