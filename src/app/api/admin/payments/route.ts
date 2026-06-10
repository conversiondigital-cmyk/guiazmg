export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const where: Record<string, unknown> = {}
    if (status && status !== "ALL") {
      where.status = status
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, email: true } },
        profile: { select: { id: true, name: true } },
      },
    })

    const [totalRevenue, pendingTotal, refundedTotal] = await Promise.all([
      prisma.payment.aggregate({
        where: { status: "APPROVED" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "PENDING" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "REFUNDED" },
        _sum: { amount: true },
      }),
    ])

    return NextResponse.json({
      payments: JSON.parse(JSON.stringify(payments)),
      stats: {
        totalRevenue: Number(totalRevenue._sum.amount ?? 0),
        pendingTotal: Number(pendingTotal._sum.amount ?? 0),
        refundedTotal: Number(refundedTotal._sum.amount ?? 0),
        total: payments.length,
      },
    })
  } catch (error) {
    console.error("Error fetching payments:", error)
    return NextResponse.json({ error: "Error al obtener pagos" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, action } = body

    if (!id || !action) {
      return NextResponse.json({ error: "ID y acción requeridos" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}

    if (action === "approve") {
      updateData.status = "APPROVED"
    } else if (action === "cancel") {
      updateData.status = "FAILED"
    } else if (action === "refund") {
      updateData.status = "REFUNDED"
    } else {
      return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: updateData,
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: `${action}_payment`,
        entityType: "Payment",
        entityId: id,
        newValue: JSON.stringify(updateData),
      },
    })

    return NextResponse.json({ payment })
  } catch (error) {
    console.error("Error processing payment action:", error)
    return NextResponse.json({ error: "Error al procesar acción" }, { status: 500 })
  }
}
