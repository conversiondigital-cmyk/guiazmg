import { getCurrentAgent } from "@/lib/agent-data"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { PageHeader, StatCard, EmptyState, NoAgentNotice } from "@/components/agente/agent-ui"

export const dynamic = "force-dynamic"

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Pendiente", cls: "bg-amber-100 text-amber-800" },
  PAID: { label: "Pagada", cls: "bg-green-100 text-green-800" },
  APPROVED: { label: "Aprobada", cls: "bg-green-100 text-green-800" },
  CANCELLED: { label: "Cancelada", cls: "bg-red-100 text-red-700" },
}

export default async function ComisionesPage() {
  const agent = await getCurrentAgent()
  if (!agent) return <NoAgentNotice />

  const commissions = await prisma.salesCommission.findMany({
    where: { salesAgentId: agent.id },
    include: { profile: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  })

  const total = commissions.reduce((s, c) => s + Number(c.amount), 0)
  const pending = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((s, c) => s + Number(c.amount), 0)
  const paid = commissions
    .filter((c) => c.status === "PAID" || c.status === "APPROVED")
    .reduce((s, c) => s + Number(c.amount), 0)

  return (
    <div>
      <PageHeader
        title="Comisiones"
        subtitle={`${commissions.length} comisión${commissions.length !== 1 ? "es" : ""} registrada${commissions.length !== 1 ? "s" : ""}`}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total generado" value={formatCurrency(total)} />
        <StatCard label="Pendiente de pago" value={formatCurrency(pending)} />
        <StatCard label="Pagado" value={formatCurrency(paid)} />
        <StatCard label="Tu comisión" value={`${Number(agent.commissionPercentage)}%`} />
      </div>

      {commissions.length === 0 ? (
        <EmptyState
          title="Sin comisiones aún"
          subtitle="Cuando los negocios que captaste generen pagos, aquí verás tus comisiones."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="px-4 py-3 font-medium">Monto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {commissions.map((c) => {
                const meta = STATUS_META[c.status] ?? { label: c.status, cls: "bg-gray-100 text-gray-700" }
                return (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{c.profile?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(Number(c.amount))}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.createdAt.toLocaleDateString("es-MX")}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
