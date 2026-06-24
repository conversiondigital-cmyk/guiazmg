import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSetting } from "@/lib/settings"
import { ingestEventsFromRss } from "@/lib/events/rss-ingest"

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

  return NextResponse.json({ ok: true, imported, skipped, errors })
}
