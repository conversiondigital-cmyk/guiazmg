export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const coupons = await prisma.promotionCoupon.findMany({
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ coupons: JSON.parse(JSON.stringify(coupons)) })
  } catch (error) {
    console.error("Error fetching coupons:", error)
    return NextResponse.json({ error: "Error al obtener cupones" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { code, description, discountType, discountValue, minAmount, maxUses, startsAt, expiresAt, isActive } = body

    if (!code || !discountType || discountValue === undefined) {
      return NextResponse.json({ error: "Código, tipo y valor requeridos" }, { status: 400 })
    }

    const existing = await prisma.promotionCoupon.findUnique({ where: { code } })
    if (existing) {
      return NextResponse.json({ error: "Ya existe un cupón con ese código" }, { status: 409 })
    }

    const coupon = await prisma.promotionCoupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        minAmount: minAmount ? parseFloat(minAmount) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        startsAt: startsAt ? new Date(startsAt) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive ?? true,
      },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "create_promotion_coupon",
        entityType: "PromotionCoupon",
        entityId: coupon.id,
      },
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Error creating coupon:", error)
    return NextResponse.json({ error: "Error al crear cupón" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (data.code !== undefined) updateData.code = data.code.toUpperCase()
    if (data.description !== undefined) updateData.description = data.description
    if (data.discountType !== undefined) updateData.discountType = data.discountType
    if (data.discountValue !== undefined) updateData.discountValue = parseFloat(data.discountValue)
    if (data.minAmount !== undefined) updateData.minAmount = data.minAmount ? parseFloat(data.minAmount) : null
    if (data.maxUses !== undefined) updateData.maxUses = data.maxUses ? parseInt(data.maxUses) : null
    if (data.startsAt !== undefined) updateData.startsAt = data.startsAt ? new Date(data.startsAt) : null
    if (data.expiresAt !== undefined) updateData.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null
    if (data.isActive !== undefined) updateData.isActive = data.isActive

    const coupon = await prisma.promotionCoupon.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Error updating coupon:", error)
    return NextResponse.json({ error: "Error al actualizar cupón" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, isActive } = body

    if (!id) {
      return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    }

    const coupon = await prisma.promotionCoupon.update({
      where: { id },
      data: { isActive },
    })

    return NextResponse.json({ coupon })
  } catch (error) {
    console.error("Error toggling coupon:", error)
    return NextResponse.json({ error: "Error al cambiar estado" }, { status: 500 })
  }
}
