import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user?.id || !["ADMIN", "EDITOR"].includes(session.user.role ?? "")) return null
  return session
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  try {
    const body = await request.json()
    const { businessId, title, description, code, startDate, endDate, isActive } = body

    if (!businessId || !title?.trim()) {
      return NextResponse.json({ error: "Negocio y título son requeridos" }, { status: 400 })
    }

    const coupon = await prisma.coupon.create({
      data: {
        businessId,
        title: title.trim(),
        description: description || null,
        code: code?.trim() || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive ?? true,
      },
      include: { profile: { select: { id: true, name: true, slug: true } } },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "CREATE_COUPON",
        entityType: "Coupon",
        entityId: coupon.id,
        newValue: JSON.stringify({ title: coupon.title, businessId }),
      },
    })

    return NextResponse.json({ coupon }, { status: 201 })
  } catch (error) {
    console.error("[ADMIN_COUPONS_POST]", error)
    return NextResponse.json({ error: "Error al crear la promoción" }, { status: 500 })
  }
}
