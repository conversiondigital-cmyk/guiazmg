import { prisma } from "@/lib/prisma"

const DAY = 86_400_000

function isUniqueViolation(e: unknown): boolean {
  return typeof e === "object" && e !== null && "code" in e && (e as { code?: unknown }).code === "P2002"
}

export type RedeemResult =
  | { ok: true; planName: string; days: number; endsAt: Date }
  | { ok: false; error: string }

// Canjea un cupón de días gratis (MembershipCoupon) para un negocio: activa una
// membresía TRIAL por N días SIN pago. Idempotente contra doble uso vía el
// @@unique([couponId, businessId]) y guardia atómica del máximo de canjes.
// Regla de negocio: 1 cupón por negocio y sin sobrescribir una membresía vigente.
// El caller debe haber verificado que el negocio es del usuario.
export async function redeemMembershipCoupon(opts: {
  code: string
  businessId: string
  userId: string
}): Promise<RedeemResult> {
  const code = opts.code.trim().toUpperCase()
  const { businessId, userId } = opts
  const now = new Date()

  try {
    const result = await prisma.$transaction(async (tx) => {
      const coupon = await tx.membershipCoupon.findUnique({
        where: { code },
        include: { plan: { select: { name: true } } },
      })
      if (!coupon || !coupon.isActive) throw new Error("El cupón no existe o está inactivo")
      if (coupon.expiresAt && coupon.expiresAt < now) throw new Error("El cupón ya expiró")
      if (coupon.maxRedemptions !== null && coupon.redemptionCount >= coupon.maxRedemptions) {
        throw new Error("El cupón ya alcanzó su límite de usos")
      }

      // No sobrescribir una membresía vigente (de pago o trial).
      const existing = await tx.profileMembership.findUnique({
        where: { businessId },
        select: { status: true, currentPeriodEnd: true },
      })
      if (
        existing &&
        existing.currentPeriodEnd > now &&
        (existing.status === "ACTIVE" || existing.status === "TRIAL")
      ) {
        throw new Error("Este negocio ya tiene una membresía activa")
      }

      // Registra el canje. El @@unique([couponId, businessId]) impide el doble uso.
      await tx.membershipCouponRedemption.create({
        data: { couponId: coupon.id, businessId, userId, days: coupon.days },
      })

      const bumped = await tx.membershipCoupon.updateMany({
        where: {
          id: coupon.id,
          ...(coupon.maxRedemptions !== null ? { redemptionCount: { lt: coupon.maxRedemptions } } : {}),
        },
        data: { redemptionCount: { increment: 1 } },
      })
      if (bumped.count === 0) throw new Error("El cupón ya alcanzó su límite de usos")

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
          // Reinicia la bandera para que el periodo nuevo reciba su aviso previo.
          renewalNotifiedAt: null,
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

      // El cupón activa el negocio: recién registrado (PENDING_REVIEW) u oculto por
      // vencimiento (INACTIVE) → ACTIVE. No toca suspendidos ni borrados.
      await tx.profile.updateMany({
        where: { id: businessId, status: { in: ["INACTIVE", "PENDING_REVIEW"] }, deletedAt: null },
        data: { status: "ACTIVE" },
      })

      return { planName: coupon.plan.name, days: coupon.days, endsAt: end }
    })

    return { ok: true, ...result }
  } catch (error) {
    if (isUniqueViolation(error)) return { ok: false, error: "Este negocio ya usó ese cupón" }
    if (error instanceof Error) return { ok: false, error: error.message }
    return { ok: false, error: "No se pudo canjear el cupón" }
  }
}
