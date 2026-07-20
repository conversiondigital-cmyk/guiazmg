import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const DAY = 24 * 60 * 60 * 1000
const GRACE_DAYS = 3

// Ciclo de vida de membresías. Diario:
//  1) Marca EXPIRED las membresías (de pago o cupón) cuyo periodo ya venció.
//  2) Tras GRACE_DAYS de gracia, oculta del directorio (Profile → INACTIVE) los
//     negocios/emprendedores cuya membresía venció. Los FUNDADORES quedan exentos.
// La CUENTA del dueño no se toca: sigue entrando al dashboard (acceso por propiedad)
// y puede renovar/canjear cupón para reactivar. Autorizado por CRON_SECRET o ADMIN.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get("authorization")
  let allowed = !!secret && authHeader === `Bearer ${secret}`
  if (!allowed) {
    const session = await auth()
    if (session?.user?.role === "ADMIN") allowed = true
  }
  if (!allowed) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const now = new Date()
  const graceCutoff = new Date(now.getTime() - GRACE_DAYS * DAY)

  // 1) Membresías vencidas → EXPIRED.
  const expired = await prisma.profileMembership.updateMany({
    where: { status: { in: ["ACTIVE", "TRIAL"] }, currentPeriodEnd: { lt: now } },
    data: { status: "EXPIRED" },
  })

  // 2) Negocios cuya membresía lleva vencida más que la gracia → ocultar (INACTIVE),
  //    salvo fundadores. Solo aplica a los que TUVIERON membresía (tienen fila).
  const lapsed = await prisma.profileMembership.findMany({
    where: { status: "EXPIRED", currentPeriodEnd: { lt: graceCutoff } },
    select: { businessId: true },
  })
  const ids = lapsed.map((m) => m.businessId)

  let hidden = 0
  if (ids.length) {
    const res = await prisma.profile.updateMany({
      where: { id: { in: ids }, status: "ACTIVE", isFounder: false, deletedAt: null },
      data: { status: "INACTIVE" },
    })
    hidden = res.count
  }

  return NextResponse.json({ expiredMemberships: expired.count, hiddenBusinesses: hidden })
}
