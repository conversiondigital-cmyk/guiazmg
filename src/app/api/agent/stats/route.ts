import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const salesAgent = await prisma.salesAgent.findUnique({
      where: { userId: session.user.id },
      include: {
        _count: { select: { businesses: true, commissions: true } },
        commissions: {
          select: { amount: true, status: true, paidAt: true },
        },
      },
    })

    if (!salesAgent) {
      return NextResponse.json({ error: "Agente no encontrado" }, { status: 404 })
    }

    const totalCommissions = salesAgent.commissions.reduce((sum, c) => sum + Number(c.amount), 0)
    const pendingCommissions = salesAgent.commissions
      .filter((c) => c.status === "PENDING")
      .reduce((sum, c) => sum + Number(c.amount), 0)
    const paidCommissions = salesAgent.commissions
      .filter((c) => c.status === "PAID" || c.status === "APPROVED")
      .reduce((sum, c) => sum + Number(c.amount), 0)

    const businesses = await prisma.business.findMany({
      where: { salesAgentId: salesAgent.id, deletedAt: null },
      select: { id: true, status: true, createdAt: true },
    })

    const activeBusinesses = businesses.filter((b) => b.status === "ACTIVE").length
    const registeredBusinesses = businesses.length

    const now = new Date()
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    const renewals = businesses.filter((b) => b.createdAt >= twelveMonthsAgo).length

    return NextResponse.json({
      clientsCount: salesAgent._count.businesses,
      businessesCount: registeredBusinesses,
      activeBusinesses,
      pendingCommissions: Math.round(pendingCommissions * 100) / 100,
      paidCommissions: Math.round(paidCommissions * 100) / 100,
      totalCommissions: Math.round(totalCommissions * 100) / 100,
      renewals,
      commissionsCount: salesAgent._count.commissions,
    })
  } catch (error) {
    console.error("[AGENT_STATS_GET]", error)
    return NextResponse.json({ error: "Error al obtener estadísticas" }, { status: 500 })
  }
}
