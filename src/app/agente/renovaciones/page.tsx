import { getCurrentAgent } from "@/lib/agent-data"
import { prisma } from "@/lib/prisma"
import { PageHeader, StatCard, EmptyState, NoAgentNotice } from "@/components/agente/agent-ui"

export const dynamic = "force-dynamic"

function meta(days: number): { label: string; cls: string } {
  if (days < 0) return { label: "Vencida", cls: "bg-red-100 text-red-700" }
  if (days <= 30) return { label: `Vence en ${days}d`, cls: "bg-amber-100 text-amber-800" }
  return { label: "Vigente", cls: "bg-green-100 text-green-800" }
}

export default async function RenovacionesPage() {
  const agent = await getCurrentAgent()
  if (!agent) return <NoAgentNotice />

  const memberships = await prisma.profileMembership.findMany({
    where: { status: "ACTIVE", profile: { salesAgentId: agent.id, deletedAt: null } },
    include: { profile: { select: { name: true } }, plan: { select: { name: true } } },
    orderBy: { currentPeriodEnd: "asc" },
  })

  const now = Date.now()
  const DAY = 86_400_000
  const rows = memberships.map((m) => ({
    id: m.id,
    business: m.profile?.name ?? "—",
    plan: m.plan?.name ?? "—",
    end: m.currentPeriodEnd,
    days: Math.ceil((m.currentPeriodEnd.getTime() - now) / DAY),
  }))

  const expiringSoon = rows.filter((r) => r.days >= 0 && r.days <= 30).length
  const expired = rows.filter((r) => r.days < 0).length

  return (
    <div>
      <PageHeader title="Renovaciones" subtitle="Membresías de tus negocios y su fecha de vencimiento." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard label="Por vencer (30 días)" value={expiringSoon} />
        <StatCard label="Vencidas" value={expired} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Sin membresías activas"
          subtitle="Cuando tus negocios contraten un plan, aquí podrás darles seguimiento a las renovaciones."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Negocio</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Vence</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = meta(r.days)
                return (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{r.business}</td>
                    <td className="px-4 py-3">{r.plan}</td>
                    <td className="px-4 py-3 text-muted-foreground">{r.end.toLocaleDateString("es-MX")}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${m.cls}`}>{m.label}</span>
                    </td>
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
