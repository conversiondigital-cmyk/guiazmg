export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getMunicipalities } from "@/lib/queries"
import { EventsClient } from "./events-client"

export default async function AdminEventosPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const [events, municipalities] = await Promise.all([
    prisma.event.findMany({ where: { deletedAt: null }, orderBy: { startAt: "desc" }, take: 200 }),
    getMunicipalities().catch(() => []),
  ])

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Eventos</h1>
        <p className="text-sm text-muted-foreground">
          Crea y administra los eventos que aparecen en la página pública de Eventos.
        </p>
      </div>
      <EventsClient
        initialEvents={JSON.parse(JSON.stringify(events))}
        municipalities={(municipalities as { id: string; name: string }[]).map((m) => ({ id: m.id, name: m.name }))}
      />
    </div>
  )
}
