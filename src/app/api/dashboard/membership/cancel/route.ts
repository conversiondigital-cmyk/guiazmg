import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const schema = z.object({
  businessId: z.string().min(1),
  cancelAtPeriodEnd: z.boolean(),
})

// Activa/desactiva la cancelación al final del período de la membresía vigente.
// Como los pagos son de una sola vez (sin renovación automática), el flag no cobra
// ni corta el servicio antes de tiempo: el negocio permanece activo hasta
// currentPeriodEnd. Solo persiste la intención del dueño (no renovar) y la refleja
// en la UI. Autorización: la membresía debe pertenecer a un negocio del usuario.
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const parsed = schema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    const { businessId, cancelAtPeriodEnd } = parsed.data

    const business = await prisma.profile.findUnique({
      where: { id: businessId },
      select: { id: true, ownerId: true, deletedAt: true },
    })
    if (!business || business.deletedAt || business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const membership = await prisma.profileMembership.findUnique({
      where: { businessId },
      select: { status: true },
    })
    if (!membership || !(membership.status === "ACTIVE" || membership.status === "TRIAL")) {
      return NextResponse.json({ error: "No hay una membresía activa" }, { status: 400 })
    }

    await prisma.profileMembership.update({
      where: { businessId },
      data: { cancelAtPeriodEnd },
    })

    return NextResponse.json({ success: true, cancelAtPeriodEnd })
  } catch (error) {
    console.error("[MEMBERSHIP_CANCEL]", error)
    return NextResponse.json({ error: "No se pudo actualizar la membresía" }, { status: 500 })
  }
}
