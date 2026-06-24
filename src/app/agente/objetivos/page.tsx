import { getCurrentAgent } from "@/lib/agent-data"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { PageHeader, NoAgentNotice } from "@/components/agente/agent-ui"

export const dynamic = "force-dynamic"

export default async function ObjetivosPage() {
  const agent = await getCurrentAgent()
  if (!agent) return <NoAgentNotice />

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [newBiz, activations, comms] = await Promise.all([
    prisma.profile.count({
      where: { salesAgentId: agent.id, deletedAt: null, createdAt: { gte: monthStart } },
    }),
    prisma.profile.count({
      where: { salesAgentId: agent.id, deletedAt: null, status: "ACTIVE", updatedAt: { gte: monthStart } },
    }),
    prisma.salesCommission.aggregate({
      where: { salesAgentId: agent.id, createdAt: { gte: monthStart } },
      _sum: { amount: true },
    }),
  ])

  const commsMonth = Number(comms._sum.amount ?? 0)
  const monthName = now.toLocaleDateString("es-MX", { month: "long", year: "numeric" })

  const goals = [
    { label: "Negocios nuevos", current: newBiz, goal: 10, render: (n: number) => String(n) },
    { label: "Activaciones", current: activations, goal: 5, render: (n: number) => String(n) },
    { label: "Comisiones generadas", current: commsMonth, goal: 2000, render: (n: number) => formatCurrency(n) },
  ]

  return (
    <div>
      <PageHeader title="Objetivos" subtitle={`Tu avance de ${monthName}.`} />

      <div className="space-y-4">
        {goals.map((g) => {
          const pct = g.goal > 0 ? Math.min(100, Math.round((g.current / g.goal) * 100)) : 0
          const done = g.current >= g.goal
          return (
            <div key={g.label} className="rounded-xl border bg-card p-5">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium">{g.label}</p>
                <p className="text-sm text-muted-foreground">
                  <span className={done ? "font-semibold text-green-600" : "font-semibold text-foreground"}>
                    {g.render(g.current)}
                  </span>{" "}
                  / {g.render(g.goal)}
                </p>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${done ? "bg-green-600" : "bg-primary"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Las metas mostradas son referenciales. La configuración de metas por agente se gestionará desde el
        panel de administración.
      </p>
    </div>
  )
}
