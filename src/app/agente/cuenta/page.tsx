import { getCurrentAgent } from "@/lib/agent-data"
import { prisma } from "@/lib/prisma"
import { formatCurrency, getInitials } from "@/lib/utils"
import { PageHeader, StatCard, NoAgentNotice } from "@/components/agente/agent-ui"
import { Mail, Percent, CalendarDays, CircleCheck, CircleOff } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function CuentaPage() {
  const agent = await getCurrentAgent()
  if (!agent) return <NoAgentNotice />

  const [user, businessesCount, activeCount, commissions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: agent.userId },
      select: { name: true, email: true, createdAt: true },
    }),
    prisma.profile.count({ where: { salesAgentId: agent.id, deletedAt: null } }),
    prisma.profile.count({ where: { salesAgentId: agent.id, deletedAt: null, status: "ACTIVE" } }),
    prisma.salesCommission.findMany({ where: { salesAgentId: agent.id }, select: { amount: true } }),
  ])

  const totalCommissions = commissions.reduce((s, c) => s + Number(c.amount), 0)

  return (
    <div>
      <PageHeader title="Mi cuenta" subtitle="Tu perfil de agente de ventas." />

      <div className="mb-6 rounded-xl border bg-card p-5">
        <div className="flex items-center gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {user?.name ? getInitials(user.name) : "A"}
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold">{user?.name || "Agente"}</p>
            <p className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
              <Mail className="size-3.5" />
              {user?.email}
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <Percent className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Comisión</p>
              <p className="font-medium">{Number(agent.commissionPercentage)}%</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            {agent.isActive ? (
              <CircleCheck className="size-4 text-green-600" />
            ) : (
              <CircleOff className="size-4 text-red-500" />
            )}
            <div>
              <p className="text-xs text-muted-foreground">Estado</p>
              <p className="font-medium">{agent.isActive ? "Activo" : "Inactivo"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg border bg-background px-3 py-2">
            <CalendarDays className="size-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Agente desde</p>
              <p className="font-medium">
                {(user?.createdAt ?? agent.createdAt).toLocaleDateString("es-MX")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <StatCard label="Negocios captados" value={businessesCount} />
        <StatCard label="Activos" value={activeCount} />
        <StatCard label="Comisiones generadas" value={formatCurrency(totalCommissions)} />
      </div>
    </div>
  )
}
