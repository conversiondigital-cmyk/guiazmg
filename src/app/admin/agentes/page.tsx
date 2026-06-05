import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { AgentesClient } from "./agentes-client"

export const dynamic = "force-dynamic"

export default async function AdminAgentesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const agents = await prisma.salesAgent.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, image: true, isActive: true } },
      _count: { select: { businesses: true, commissions: true } },
      commissions: {
        select: { amount: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const data = agents.map((agent) => ({
    id: agent.id,
    userId: agent.userId,
    commissionPercentage: Number(agent.commissionPercentage),
    isActive: agent.isActive,
    createdAt: agent.createdAt.toISOString(),
    user: agent.user,
    businessesCount: agent._count.businesses,
    commissionsCount: agent._count.commissions,
    pendingCommissions: agent.commissions
      .filter((c) => c.status === "PENDING")
      .reduce((sum, c) => sum + Number(c.amount), 0),
    totalCommissions: agent.commissions.reduce((sum, c) => sum + Number(c.amount), 0),
  }))

  const stats = {
    activeAgents: agents.filter((a) => a.isActive).length,
    totalClients: agents.reduce((sum, a) => sum + a._count.businesses, 0),
    pendingCommissions: agents.reduce(
      (sum, a) =>
        sum +
        a.commissions
          .filter((c) => c.status === "PENDING")
          .reduce((s, c) => s + Number(c.amount), 0),
      0
    ),
  }

  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <AgentesClient agents={data} stats={stats} />
    </Suspense>
  )
}
