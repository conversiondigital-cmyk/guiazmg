import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSetting } from "@/lib/settings"
import { ingestEventsFromRss } from "@/lib/events/rss-ingest"
import { createNotification } from "@/lib/notifications/create"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Importa eventos desde los feeds RSS configurados (Admin → Configuración → Eventos).
// Autorizado por: el secret de cron de Vercel (header Authorization) o una sesión ADMIN
// (para dispararlo a mano). Los eventos entran como borrador para revisión.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get("authorization")
  let allowed = !!secret && authHeader === `Bearer ${secret}`

  if (!allowed) {
    const session = await auth()
    if (session?.user?.role === "ADMIN") allowed = true
  }
  if (!allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const feeds = (await getSetting("events_rss_feeds"))
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)

  if (feeds.length === 0) {
    return NextResponse.json({
      ok: true,
      imported: 0,
      message: "No hay feeds configurados (Admin → Configuración → Eventos).",
    })
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const url of feeds.slice(0, 10)) {
    try {
      const r = await ingestEventsFromRss(url)
      imported += r.imported
      skipped += r.skipped
    } catch (e) {
      errors.push(`${url}: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  // Avisar a los administradores cuando entran eventos nuevos (para que los
  // revisen y publiquen). Fire-and-forget: nunca rompe la respuesta del cron.
  if (imported > 0) {
    try {
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true },
      })
      await Promise.all(
        admins.map((a) =>
          createNotification({
            userId: a.id,
            title: `${imported} evento${imported === 1 ? "" : "s"} nuevo${imported === 1 ? "" : "s"} por revisar`,
            message: "Se importaron eventos desde las fuentes RSS. Revísalos, ajusta la fecha y publícalos.",
            type: "SYSTEM",
            link: "/admin/eventos",
          }),
        ),
      )
    } catch (e) {
      console.error("[cron/events] no se pudo notificar a admins:", e)
    }
  }

  return NextResponse.json({ ok: true, imported, skipped, errors })
}
