import { prisma } from "@/lib/prisma"

// Cupones de DESCUENTO (PromotionCoupon): rebajan el precio de un pago. Distinto
// de MembershipCoupon (activa un plan gratis sin pago). Toda la lógica vive aquí
// para que Mercado Pago y Stripe validen y descuenten EXACTAMENTE igual, y el
// descuento se calcula en NUESTRO servidor: a la pasarela solo le llega el monto
// final. Así el admin de Guía ZMG es la única fuente de verdad de los cupones
// (no se crean objetos Coupon en Stripe/MP).

export type ResolvedCoupon = {
  code: string
  discountType: "PERCENTAGE" | "FIXED"
  discountValue: number
}

export type CouponResolution =
  | { ok: true; coupon: ResolvedCoupon | null }
  | { ok: false; error: string }

// Valida un código contra el monto dado. Devuelve el cupón normalizado, null si
// no se pasó código (sin descuento), o un error legible.
export async function resolveCoupon(
  couponCode: unknown,
  amount: number,
): Promise<CouponResolution> {
  if (couponCode === undefined || couponCode === null || couponCode === "") {
    return { ok: true, coupon: null }
  }
  // Endurecimiento: solo strings (evita que {gte:""} llegue al where de Prisma).
  if (typeof couponCode !== "string") {
    return { ok: false, error: "Cupón inválido" }
  }

  const found = await prisma.promotionCoupon.findUnique({ where: { code: couponCode.trim() } })
  if (!found) return { ok: false, error: "Cupón inválido" }
  if (!found.isActive) return { ok: false, error: "Cupón inactivo" }

  const now = new Date()
  if (found.startsAt && found.startsAt > now) return { ok: false, error: "Cupón aún no vigente" }
  if (found.expiresAt && found.expiresAt < now) return { ok: false, error: "Cupón expirado" }
  if (found.maxUses !== null && found.usedCount >= found.maxUses) {
    return { ok: false, error: "Cupón agotado" }
  }
  if (found.minAmount !== null && amount < Number(found.minAmount)) {
    return { ok: false, error: "Cupón no aplica para este monto" }
  }

  return {
    ok: true,
    coupon: {
      code: found.code,
      discountType: found.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FIXED",
      discountValue: Number(found.discountValue),
    },
  }
}

// Aplica el descuento al monto (nunca por debajo de 0). Redondea a 2 decimales.
export function applyCoupon(amount: number, coupon: ResolvedCoupon | null): number {
  if (!coupon) return amount
  const discounted =
    coupon.discountType === "PERCENTAGE"
      ? amount * (1 - coupon.discountValue / 100)
      : amount - coupon.discountValue
  return Math.max(0, Math.round(discounted * 100) / 100)
}

// Incrementa el uso del cupón al CONCRETARSE el pago. El llamador debe invocarlo
// solo en la primera activación (webhook no duplicado) para respetar idempotencia.
export async function incrementCouponUsage(code: string | null | undefined): Promise<void> {
  if (!code) return
  await prisma.promotionCoupon
    .updateMany({ where: { code }, data: { usedCount: { increment: 1 } } })
    .catch(() => {})
}
