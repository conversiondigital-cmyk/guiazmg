import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { createNotification } from "@/lib/notifications/create"
import { enforceRateLimits } from "@/lib/security/request-rate-limit"
import { getTrustedClientIp } from "@/lib/security/rate-limit"

export const dynamic = "force-dynamic"

const REASONS: Record<string, string> = {
  cerrado: "El negocio cerró / ya no existe",
  "datos-incorrectos": "Información incorrecta",
  duplicado: "Perfil duplicado",
  inapropiado: "Contenido inapropiado",
  otro: "Otro",
}

// Reporte público de un negocio (o sugerencia de cambio). No requiere sesión pero
// se acota por IP. Avisa a los administradores para que lo revisen.
export async function POST(req: NextRequest) {
  const ip = getTrustedClientIp(req)
  const limited = await enforceRateLimits([{ key: `report:ip:${ip}`, windowMs: 60_000, maxRequests: 5 }])
  if (limited) {
    return NextResponse.json({ error: "Demasiados reportes. Espera un momento." }, { status: 429 })
  }

  const { businessId, reason, detail } = (await req.json().catch(() => ({}))) as {
    businessId?: string
    reason?: string
    detail?: string
  }
  if (!businessId || typeof businessId !== "string") {
    return NextResponse.json({ error: "Falta el negocio" }, { status: 400 })
  }
  const biz = await prisma.profile.findUnique({ where: { id: businessId }, select: { id: true, name: true } })
  if (!biz) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })

  const session = await auth().catch(() => null)
  const reasonLabel = (reason && REASONS[reason]) || REASONS.otro
  const detailText = typeof detail === "string" ? detail.trim().slice(0, 500) : ""

  const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } })
  await Promise.allSettled(
    admins.map((a) =>
      createNotification({
        userId: a.id,
        type: "SYSTEM",
        title: "Reporte de un negocio",
        message: `"${biz.name}" — ${reasonLabel}${detailText ? `: ${detailText}` : ""}${session?.user?.email ? ` (reporta ${session.user.email})` : ""}`,
        link: `/admin/negocios/${biz.id}`,
      }),
    ),
  )

  return NextResponse.json({ ok: true })
}
