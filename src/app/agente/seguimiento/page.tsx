import { getCurrentAgent } from "@/lib/agent-data"
import { prisma } from "@/lib/prisma"
import { PageHeader, EmptyState, NoAgentNotice } from "@/components/agente/agent-ui"
import { Phone, Mail, Clock } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_META: Record<string, { label: string; cls: string }> = {
  PENDING_REVIEW: { label: "Por aprobar", cls: "bg-amber-100 text-amber-800" },
  DRAFT: { label: "Borrador", cls: "bg-blue-100 text-blue-800" },
}

export default async function SeguimientoPage() {
  const agent = await getCurrentAgent()
  if (!agent) return <NoAgentNotice />

  const businesses = await prisma.profile.findMany({
    where: {
      salesAgentId: agent.id,
      deletedAt: null,
      status: { in: ["DRAFT", "PENDING_REVIEW"] },
    },
    select: {
      id: true,
      name: true,
      phone: true,
      whatsapp: true,
      email: true,
      status: true,
      createdAt: true,
      owner: { select: { name: true } },
    },
    orderBy: { createdAt: "asc" },
  })

  const now = Date.now()
  const DAY = 86_400_000

  return (
    <div>
      <PageHeader
        title="Seguimiento"
        subtitle="Negocios que aún no cierran. Da seguimiento a los más antiguos primero."
      />

      {businesses.length === 0 ? (
        <EmptyState
          title="Nada pendiente 🎉"
          subtitle="No tienes negocios en proceso. Todos tus prospectos están cerrados o activos."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {businesses.map((b) => {
            const meta = STATUS_META[b.status] ?? { label: b.status, cls: "bg-gray-100 text-gray-700" }
            const days = Math.floor((now - b.createdAt.getTime()) / DAY)
            const phone = b.phone || b.whatsapp
            return (
              <div key={b.id} className="rounded-xl border bg-card p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.name}</p>
                    {b.owner?.name ? (
                      <p className="truncate text-xs text-muted-foreground">{b.owner.name}</p>
                    ) : null}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}>
                    {meta.label}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {phone ? (
                    <p className="flex items-center gap-1.5">
                      <Phone className="size-3 shrink-0" />
                      {phone}
                    </p>
                  ) : null}
                  {b.email ? (
                    <p className="flex items-center gap-1.5 truncate">
                      <Mail className="size-3 shrink-0" />
                      {b.email}
                    </p>
                  ) : null}
                  <p className="flex items-center gap-1.5 pt-0.5 font-medium text-foreground/70">
                    <Clock className="size-3 shrink-0" />
                    {days === 0 ? "Registrado hoy" : `${days} día${days !== 1 ? "s" : ""} sin cerrar`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
