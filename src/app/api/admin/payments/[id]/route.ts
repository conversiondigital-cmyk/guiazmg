export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        profile: { select: { id: true, name: true, slug: true } },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Pago no encontrado" }, { status: 404 })
    }

    return NextResponse.json({ payment: JSON.parse(JSON.stringify(payment)) })
  } catch (error) {
    console.error("Error fetching payment:", error)
    return NextResponse.json({ error: "Error al obtener pago" }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status } = body

    if (!status || !["APPROVED", "REFUNDED", "CANCELLED"].includes(status)) {
      return NextResponse.json({ error: "Estado no válido. Usar: APPROVED, REFUNDED, CANCELLED" }, { status: 400 })
    }

    const payment = await prisma.payment.update({
      where: { id },
      data: { status },
    })

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: `${status.toLowerCase()}_payment`,
        entityType: "Payment",
        entityId: id,
        newValue: JSON.stringify({ status }),
      },
    })

    return NextResponse.json({ payment })
  } catch (error) {
    console.error("Error updating payment:", error)
    return NextResponse.json({ error: "Error al actualizar pago" }, { status: 500 })
  }
}
