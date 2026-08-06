import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { touchRedis } from "@/lib/redis-keepalive"
import { createNotification } from "@/lib/notifications/create"
import { sendEmail, sendBusinessSuspendedEmail } from "@/lib/email"
import { getPublicAppUrl } from "@/lib/env"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const DAY = 24 * 60 * 60 * 1000
const GRACE_DAYS = 2 // gracia tras vencer, antes de ocultar el negocio
const REMIND_DAYS = 3 // avisar cuando falten <= 3 días para vencer

// Ciclo de vida de membresías. Diario:
//  1) Marca EXPIRED las membresías (de pago o cupón) cuyo periodo ya venció.
//  2) Tras GRACE_DAYS de gracia, oculta del directorio (Profile → INACTIVE) los
//     negocios/emprendedores cuya membresía venció. Los FUNDADORES quedan exentos.
// La CUENTA del dueño no se toca: sigue entrando al dashboard (acceso por propiedad)
// y puede renovar/canjear cupón para reactivar. Autorizado por CRON_SECRET o ADMIN.
export async function GET(req: NextRequest) {
  // Latido diario para mantener despierta la Redis (Upstash la archiva por
  // inactividad). Va antes del auth para que corra siempre que Vercel dispare el
  // cron; nunca lanza.
  await touchRedis()

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
  const remindCutoff = new Date(now.getTime() + REMIND_DAYS * DAY)

  // 0) Aviso PREVIO al vencimiento: membresías vigentes que vencen en <= REMIND_DAYS
  //    y aún no se les avisó (renewalNotifiedAt null). Correo + notificación in-app.
  //    renewalNotifiedAt evita reenviar el mismo aviso cada día.
  let reminded = 0
  const soonToExpire = await prisma.profileMembership.findMany({
    where: {
      status: { in: ["ACTIVE", "TRIAL"] },
      currentPeriodEnd: { gt: now, lte: remindCutoff },
      renewalNotifiedAt: null,
    },
    select: {
      id: true,
      currentPeriodEnd: true,
      plan: { select: { name: true } },
      profile: { select: { name: true, owner: { select: { id: true, email: true } } } },
    },
  })
  for (const m of soonToExpire) {
    const ownerId = m.profile?.owner?.id
    const ownerEmail = m.profile?.owner?.email
    const businessName = m.profile?.name ?? "tu negocio"
    const expiry = m.currentPeriodEnd.toLocaleDateString("es-MX")
    if (ownerId) {
      await createNotification({
        userId: ownerId,
        type: "EXPIRATION",
        title: "Tu membresía está por vencer",
        message: `La membresía de "${businessName}" vence el ${expiry}. Renueva para no salir del directorio.`,
      }).catch(() => {})
    }
    if (ownerEmail) {
      await sendEmail(
        ownerEmail,
        "renewal_reminder",
        {
          businessName,
          planName: m.plan?.name ?? "Guía ZMG",
          expiryDate: expiry,
          renewalUrl: `${getPublicAppUrl()}/dashboard/membresia`,
        },
        ownerId,
      ).catch(() => {})
    }
    await prisma.profileMembership
      .update({ where: { id: m.id }, data: { renewalNotifiedAt: now } })
      .catch(() => {})
    reminded++
  }

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
    // Toma los que de verdad se van a ocultar (con su dueño) para avisarles.
    const toHide = await prisma.profile.findMany({
      where: { id: { in: ids }, status: "ACTIVE", isFounder: false, deletedAt: null },
      select: { id: true, name: true, owner: { select: { id: true, email: true } } },
    })
    const res = await prisma.profile.updateMany({
      where: { id: { in: ids }, status: "ACTIVE", isFounder: false, deletedAt: null },
      data: { status: "INACTIVE" },
    })
    hidden = res.count
    // Aviso al dueño: su negocio dejó de estar visible porque venció la membresía.
    for (const b of toHide) {
      if (b.owner?.id) {
        await createNotification({
          userId: b.owner.id,
          type: "EXPIRATION",
          title: "Tu negocio dejó de estar visible",
          message: `"${b.name}" salió del directorio porque tu membresía venció. Renueva para reactivarlo.`,
        }).catch(() => {})
      }
      if (b.owner?.email) {
        await sendBusinessSuspendedEmail(
          b.owner.email,
          { businessName: b.name, reason: "tu membresía venció" },
          b.owner.id,
        ).catch(() => {})
      }
    }
  }

  return NextResponse.json({
    reminded,
    expiredMemberships: expired.count,
    hiddenBusinesses: hidden,
  })
}
