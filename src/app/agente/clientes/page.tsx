import Link from "next/link"
import { getCurrentAgent } from "@/lib/agent-data"
import { prisma } from "@/lib/prisma"
import { PageHeader, StatCard, EmptyState, NoAgentNotice } from "@/components/agente/agent-ui"
import { Phone, Mail, ExternalLink } from "lucide-react"

export const dynamic = "force-dynamic"

const STATUS_META: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Activo", cls: "bg-green-100 text-green-800" },
  PENDING_REVIEW: { label: "Por aprobar", cls: "bg-amber-100 text-amber-800" },
  DRAFT: { label: "Borrador", cls: "bg-gray-100 text-gray-700" },
  SUSPENDED: { label: "Suspendido", cls: "bg-red-100 text-red-700" },
  INACTIVE: { label: "Inactivo", cls: "bg-gray-100 text-gray-700" },
}

export default async function ClientesPage() {
  const agent = await getCurrentAgent()
  if (!agent) return <NoAgentNotice />

  const businesses = await prisma.profile.findMany({
    where: { salesAgentId: agent.id, deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      phone: true,
      whatsapp: true,
      email: true,
      status: true,
      createdAt: true,
      owner: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const active = businesses.filter((b) => b.status === "ACTIVE").length

  return (
    <div>
      <PageHeader title="Clientes captados" subtitle="Negocios que registraste y tienes asignados." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:max-w-md">
        <StatCard label="Total captados" value={businesses.length} />
        <StatCard label="Activos" value={active} />
      </div>

      {businesses.length === 0 ? (
        <EmptyState
          title="Aún no captas clientes"
          subtitle="Registra negocios desde Prospectos; los que tengas asignados aparecerán aquí."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {businesses.map((b) => {
            const meta = STATUS_META[b.status] ?? { label: b.status, cls: "bg-gray-100 text-gray-700" }
            const phone = b.phone || b.whatsapp
            return (
              <div key={b.id} className="rounded-xl border bg-card p-4">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{b.name}</p>
                    {b.owner?.name ? <p className="truncate text-xs text-muted-foreground">{b.owner.name}</p> : null}
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
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
                  <p className="pt-0.5">Captado el {b.createdAt.toLocaleDateString("es-MX")}</p>
                </div>
                <Link
                  href={`/perfil/${b.slug}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  Ver ficha <ExternalLink className="size-3" />
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
