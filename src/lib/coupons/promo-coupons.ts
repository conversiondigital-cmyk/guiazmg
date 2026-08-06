import { cache } from "react"
import { prisma } from "@/lib/prisma"

export type PromoCoupon = { code: string; days: number }
export type PromoCoupons = { EMPRENDEDOR: PromoCoupon | null; NEGOCIO: PromoCoupon | null }

// Devuelve el cupón de días gratis VIGENTE (activo, no expirado y con cupos
// disponibles) para cada tipo de perfil, para autocompletarlo en el registro y
// que el alta active la membresía de prueba sin pago. Si la promo terminó o se
// agotó para un plan, devuelve null → ese registrante tendrá que pagar.
// cache(): una sola consulta por request (metadata + página comparten).
export const getActivePromoCoupons = cache(async (): Promise<PromoCoupons> => {
  const now = new Date()
  const rows = await prisma.membershipCoupon.findMany({
    where: {
      isActive: true,
      days: { gte: 60 },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    select: {
      code: true,
      days: true,
      maxRedemptions: true,
      redemptionCount: true,
      plan: { select: { slug: true } },
    },
    orderBy: { days: "desc" }, // si hubiera varios, el de más días
  })

  const pick = (slug: string): PromoCoupon | null => {
    const hit = rows.find(
      (r) =>
        r.plan.slug === slug &&
        (r.maxRedemptions === null || r.redemptionCount < r.maxRedemptions),
    )
    return hit ? { code: hit.code, days: hit.days } : null
  }

  return { EMPRENDEDOR: pick("emprendedor"), NEGOCIO: pick("negocio") }
})
