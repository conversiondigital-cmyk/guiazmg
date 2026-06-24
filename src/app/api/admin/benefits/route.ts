import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const dynamic = "force-dynamic"

const schema = z.object({
  businessId: z.string().min(1),
  type: z.enum(["plan", "boost"]),
  planId: z.string().optional(),
  days: z.coerce.number().int().min(1).max(3650).optional(),
  boostDefinitionId: z.string().optional(),
})

const DAY = 86_400_000

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const parsed = schema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    const { businessId, type, planId, days, boostDefinitionId } = parsed.data

    const business = await prisma.profile.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, ownerId: true },
    })
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }

    const now = new Date()
    let summary = ""

    if (type === "plan") {
      if (!planId) return NextResponse.json({ error: "Selecciona un plan" }, { status: 400 })
      const plan = await prisma.membershipPlan.findUnique({ where: { id: planId }, select: { name: true } })
      if (!plan) return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
      const d = days ?? 30
      const end = new Date(now.getTime() + d * DAY)
      await prisma.profileMembership.upsert({
        where: { businessId },
        update: {
          planId,
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: end,
          cancelAtPeriodEnd: false,
        },
        create: {
          businessId,
          planId,
          provider: "MERCADO_PAGO",
          providerSubscriptionId: "admin-gift",
          status: "ACTIVE",
          currentPeriodStart: now,
          currentPeriodEnd: end,
        },
      })
      summary = `Plan "${plan.name}" de regalo por ${d} días`
    } else {
      if (!boostDefinitionId) return NextResponse.json({ error: "Selecciona un boost" }, { status: 400 })
      const def = await prisma.boostDefinition.findUnique({ where: { id: boostDefinitionId } })
      if (!def) return NextResponse.json({ error: "Boost no encontrado" }, { status: 404 })
      const end = new Date(now.getTime() + def.durationDays * DAY)
      await prisma.boost.create({
        data: {
          businessId,
          pricePaid: 0,
          priorityScore: def.priorityBonus,
          startsAt: now,
          endsAt: end,
        },
      })
      summary = `Boost "${def.name}" de regalo por ${def.durationDays} días`
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "ADMIN_BENEFIT_GRANT",
        entityType: "Business",
        entityId: businessId,
        newValue: JSON.stringify({ type, summary }),
      },
    })

    if (business.ownerId) {
      await prisma.notification
        .create({
          data: {
            userId: business.ownerId,
            title: "Beneficio otorgado 🎁",
            message: `Se aplicó a "${business.name}": ${summary}.`,
          },
        })
        .catch(() => {})
    }

    return NextResponse.json({ success: true, summary })
  } catch (error) {
    console.error("[ADMIN_BENEFIT_POST]", error)
    return NextResponse.json({ error: "Error al otorgar el beneficio" }, { status: 500 })
  }
}
