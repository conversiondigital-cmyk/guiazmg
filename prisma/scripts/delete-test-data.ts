// Fase D.1 — BORRADO IRREVERSIBLE de los artefactos de prueba en producción.
// Targetea por ID EXACTO (verificados con report-test-data.ts) en orden FK-seguro:
// hijo antes que padre. Cada borrado va en try/catch para que un fallo no bloquee
// el resto. Idempotente: si un ID ya no existe, lo reporta y sigue.
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

const p = prisma as any

const IDS = {
  boost: "cmsfp7kod000204l5u970xc5g",
  payments: [
    "cmsfe7y6g000b04i5ypk4mrr4", // MEMBERSHIP 49
    "cmsfllukl000104jp8jgdmfmf", // MEMBERSHIP 74.5
    "cmsfp7knc000104l5tiwlzori", // BOOST 49
  ],
  membership: "cmsfe7y78000c04i50hzhzd8u",
  couponDulces20: "cmsfngpf2000004jra0dyjx3p",
  promotionCouponPrueba50: "cmsfiyi43000804l4ggd9vyi5",
  marketplaceListing: "cmsfc0h7o000004l8qxc9a33u",
}

async function step(label: string, fn: () => Promise<unknown>) {
  try {
    const r = await fn()
    console.log(`OK  ${label} -> ${JSON.stringify(r)}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.log(`SKIP ${label} -> ${msg.split("\n")[0]}`)
  }
}

async function main() {
  console.log("== BORRADO de datos de prueba (prod) ==")

  // 1) Boost primero (referencia al Payment vía paymentId).
  await step("Boost", () => p.boost.delete({ where: { id: IDS.boost } }))

  // 2) Pagos de prueba (ya sin el boost que los referenciaba).
  await step("Payments", () => p.payment.deleteMany({ where: { id: { in: IDS.payments } } }))

  // 3) Membresía de prueba del negocio demo (Dulces Mexicanos).
  await step("ProfileMembership", () => p.profileMembership.delete({ where: { id: IDS.membership } }))

  // 4) Promo de negocio DULCES20. Borra primero cualquier redención dependiente.
  await step("CouponRedemption(DULCES20)", () =>
    p.couponRedemption.deleteMany({ where: { couponId: IDS.couponDulces20 } }),
  )
  await step("Coupon DULCES20", () => p.coupon.delete({ where: { id: IDS.couponDulces20 } }))

  // 5) Cupón de descuento PRUEBA50. Borra primero usos/redenciones si existen.
  await step("PromotionCouponRedemption(PRUEBA50)", () =>
    p.promotionCouponRedemption.deleteMany({ where: { couponId: IDS.promotionCouponPrueba50 } }),
  )
  await step("PromotionCoupon PRUEBA50", () =>
    p.promotionCoupon.delete({ where: { id: IDS.promotionCouponPrueba50 } }),
  )

  // 6) Publicación marketplace de prueba (cascada de imágenes si aplica).
  await step("MarketplaceListing PRUEBA", () =>
    p.marketplaceListing.delete({ where: { id: IDS.marketplaceListing } }),
  )

  console.log("== Fin ==")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
