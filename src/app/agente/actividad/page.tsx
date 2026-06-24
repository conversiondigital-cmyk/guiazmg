import { getCurrentAgent } from "@/lib/agent-data"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { PageHeader, EmptyState, NoAgentNotice } from "@/components/agente/agent-ui"
import { Store, DollarSign } from "lucide-react"

export const dynamic = "force-dynamic"

type Activity = { id: string; date: Date; kind: "business" | "commission"; text: string }

export default async function ActividadPage() {
  const agent = await getCurrentAgent()
  if (!agent) return <NoAgentNotice />

  const [businesses, commissions] = await Promise.all([
    prisma.profile.findMany({
      where: { salesAgentId: agent.id, deletedAt: null },
      select: { id: true, name: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
    prisma.salesCommission.findMany({
      where: { salesAgentId: agent.id },
      include: { profile: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ])

  const events: Activity[] = [
    ...businesses.map((b) => ({
      id: `b-${b.id}`,
      date: b.createdAt,
      kind: "business" as const,
      text: `Registraste el negocio "${b.name}"`,
    })),
    ...commissions.map((c) => ({
      id: `c-${c.id}`,
      date: c.createdAt,
      kind: "commission" as const,
      text: `Comisión de ${formatCurrency(Number(c.amount))}${c.profile?.name ? ` por ${c.profile.name}` : ""}`,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 30)

  return (
    <div>
      <PageHeader title="Actividad" subtitle="Tu historial reciente de captación y comisiones." />

      {events.length === 0 ? (
        <EmptyState title="Sin actividad" subtitle="Cuando registres negocios o generes comisiones, aparecerán aquí." />
      ) : (
        <ol className="relative space-y-4 rounded-xl border bg-card p-5">
          {events.map((e) => (
            <li key={e.id} className="flex gap-3">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                  e.kind === "commission" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {e.kind === "commission" ? <DollarSign className="size-4" /> : <Store className="size-4" />}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm">{e.text}</p>
                <p className="text-xs text-muted-foreground">{e.date.toLocaleDateString("es-MX")}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
