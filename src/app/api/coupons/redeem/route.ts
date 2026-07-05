import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

const DAY = 86_400_000

// El namespace Prisma del cliente generado es solo-tipo (@ts-nocheck), así que la
// violación de unicidad (P2002) se detecta por el código del error, no con instanceof.
function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: unknown }).code === "P2002"
}

const schema = z.object({
  code: z.string().trim().min(1).max(40),
  businessId: z.string().min(1),
})

// Error de negocio (cupón inválido/agotado/expirado) → 400 con mensaje claro.
class CouponError extends Error {}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Inicia sesión para canjear un cupón" }, { status: 401 })
    }

    const parsed = schema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    const code = parsed.data.code.toUpperCase()
    const { businessId } = parsed.data

    // El negocio debe ser del usuario (autorización).
    const business = await prisma.profile.findUnique({
      where: { id: businessId },
      select: { id: true, name: true, ownerId: true, deletedAt: true },
    })
    if (!business || business.deletedAt || business.ownerId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const now = new Date()

    const result = await prisma.$transaction(async (tx) => {
      const coupon = await tx.membershipCoupon.findUnique({
        where: { code },
        include: { plan: { select: { name: true } } },
      })
      if (!coupon || !coupon.isActive) throw new CouponError("El cupón no existe o está inactivo")
      if (coupon.expiresAt && coupon.expiresAt < now) throw new CouponError("El cupón ya expiró")
      if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
        throw new CouponError("El cupón ya alcanzó su límite de usos")
      }

      // Registra el canje. El @@unique([couponId, businessId]) impide que el mismo
      // negocio use el mismo cupón dos veces (P2002 abajo).
      await tx.membershipCouponRedemption.create({
        data: { couponId: coupon.id, businessId, userId: session.user!.id, days: coupon.days },
      })

      // Incremento con guardia atómica contra el máximo (evita pasarse por carrera).
      const bumped = await tx.membershipCoupon.updateMany({
        where: {
          id: coupon.id,
          ...(coupon.maxRedemptions !== null ? { redemptionCount: { lt: coupon.maxRedemptions } } : {}),
        },
        data: { redemptionCount: { increment: 1 } },
      })
      if (bumped.count === 0) throw new CouponError("El cupón ya alcanzó su límite de usos")

      // Otorga el plan por N días, sin pago (misma mecánica que el beneficio de admin).
      const end = new Date(now.getTime() + coupon.days * DAY)
      await tx.profileMembership.upsert({
        where: { businessId },
        update: {
          planId: coupon.planId,
          status: "TRIAL",
          currentPeriodStart: now,
          currentPeriodEnd: end,
          cancelAtPeriodEnd: true,
          provider: "MERCADO_PAGO",
          providerSubscriptionId: `coupon:${coupon.code}`,
        },
        create: {
          businessId,
          planId: coupon.planId,
          provider: "MERCADO_PAGO",
          providerSubscriptionId: `coupon:${coupon.code}`,
          status: "TRIAL",
          currentPeriodStart: now,
          currentPeriodEnd: end,
        },
      })

      return { planName: coupon.plan.name, days: coupon.days, endsAt: end }
    })

    await prisma.auditLog
      .create({
        data: {
          actorUserId: session.user.id,
          action: "COUPON_REDEEM",
          entityType: "Business",
          entityId: businessId,
          newValue: JSON.stringify({ code, plan: result.planName, days: result.days }),
        },
      })
      .catch(() => {})

    await prisma.notification
      .create({
        data: {
          userId: session.user.id,
          title: "Cupón activado 🎁",
          message: `Se activó "${result.planName}" en "${business.name}" por ${result.days} días.`,
        },
      })
      .catch(() => {})

    return NextResponse.json({
      success: true,
      planName: result.planName,
      days: result.days,
      endsAt: result.endsAt,
    })
  } catch (error) {
    if (error instanceof CouponError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    // El negocio ya canjeó este cupón (violación del @@unique).
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "Este negocio ya usó ese cupón" }, { status: 400 })
    }
    console.error("[COUPON_REDEEM]", error)
    return NextResponse.json({ error: "No se pudo canjear el cupón" }, { status: 500 })
  }
}
