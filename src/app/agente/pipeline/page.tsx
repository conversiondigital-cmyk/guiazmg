import { getCurrentAgent } from "@/lib/agent-data"
import { prisma } from "@/lib/prisma"
import { PageHeader, StatCard, EmptyState, NoAgentNotice } from "@/components/agente/agent-ui"

export const dynamic = "force-dynamic"

const STAGES: { key: string; label: string; bar: string }[] = [
  { key: "DRAFT", label: "Nuevo", bar: "bg-blue-500" },
  { key: "PENDING_REVIEW", label: "En revisión", bar: "bg-amber-500" },
  { key: "ACTIVE", label: "Cliente activo", bar: "bg-green-600" },
  { key: "INACTIVE", label: "Inactivo / suspendido", bar: "bg-gray-400" },
]

export default async function PipelinePage() {
  const agent = await getCurrentAgent()
  if (!agent) return <NoAgentNotice />

  const businesses = await prisma.profile.findMany({
    where: { salesAgentId: agent.id, deletedAt: null },
    select: { status: true },
  })

  const total = businesses.length
  const countOf = (key: string) =>
    key === "INACTIVE"
      ? businesses.filter((b) => b.status === "INACTIVE" || b.status === "SUSPENDED").length
      : businesses.filter((b) => b.status === key).length

  const active = countOf("ACTIVE")
  const conversion = total ? Math.round((active / total) * 100) : 0

  return (
    <div>
      <PageHeader title="Pipeline" subtitle="Embudo de tus negocios por etapa." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard label="Total en pipeline" value={total} />
        <StatCard label="Tasa de conversión" value={`${conversion}%`} />
      </div>

      {total === 0 ? (
        <EmptyState
          title="Pipeline vacío"
          subtitle="Registra prospectos para empezar a mover negocios por el embudo."
        />
      ) : (
        <div className="space-y-3 rounded-xl border bg-card p-5">
          {STAGES.map((s) => {
            const n = countOf(s.key)
            const pct = total ? Math.round((n / total) * 100) : 0
            return (
              <div key={s.key}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{s.label}</span>
                  <span className="text-muted-foreground">
                    {n} · {pct}%
                  </span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className={`h-full rounded-full ${s.bar}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
