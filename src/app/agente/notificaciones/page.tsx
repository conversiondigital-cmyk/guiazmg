import { getCurrentAgent } from "@/lib/agent-data"
import { prisma } from "@/lib/prisma"
import { PageHeader, EmptyState, NoAgentNotice } from "@/components/agente/agent-ui"
import { Bell } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function NotificacionesPage() {
  const agent = await getCurrentAgent()
  if (!agent) return <NoAgentNotice />

  const notifications = await prisma.notification.findMany({
    where: { userId: agent.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const unread = notifications.filter((n) => !n.isRead).length

  return (
    <div>
      <PageHeader
        title="Notificaciones"
        subtitle={unread > 0 ? `${unread} sin leer` : "Estás al día"}
      />

      {notifications.length === 0 ? (
        <EmptyState title="Sin notificaciones" subtitle="Aquí verás avisos sobre tus negocios, comisiones y renovaciones." />
      ) : (
        <div className="divide-y rounded-xl border bg-card">
          {notifications.map((n) => (
            <div key={n.id} className={`flex gap-3 p-4 ${n.isRead ? "" : "bg-primary/5"}`}>
              <span
                className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
                  n.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                }`}
              >
                <Bell className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${n.isRead ? "font-medium" : "font-semibold"}`}>{n.title}</p>
                  {!n.isRead && <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />}
                </div>
                {n.message ? <p className="text-sm text-muted-foreground">{n.message}</p> : null}
                <p className="mt-0.5 text-xs text-muted-foreground">{n.createdAt.toLocaleDateString("es-MX")}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
