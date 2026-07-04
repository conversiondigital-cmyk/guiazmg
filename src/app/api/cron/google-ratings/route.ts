import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { syncGoogleRatingsBatch } from "@/lib/google/places"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

// Resincroniza en lote el rating de Google de los negocios activos con URL de
// Google. Autorizado por el CRON_SECRET (header Authorization) o una sesión ADMIN.
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

  const { searchParams } = new URL(req.url)
  const limit = Math.min(200, Math.max(1, Number(searchParams.get("limit")) || 50))
  const result = await syncGoogleRatingsBatch(limit)
  return NextResponse.json({ ok: true, ...result })
}
