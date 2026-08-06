// Reporte (SOLO LECTURA) de los artefactos de prueba a limpiar antes del lanzamiento.
// No borra nada: lista lo que coincide para confirmar con el humano.
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

const p = prisma as any

async function safe(label: string, fn: () => Promise<unknown[]>) {
  try {
    const rows = await fn()
    console.log(`\n== ${label} == (${rows.length})`)
    for (const r of rows) console.log("  ", JSON.stringify(r))
  } catch (e) {
    console.log(`\n== ${label} == ERROR: ${e instanceof Error ? e.message : e}`)
  }
}

async function main() {
  await safe("PromotionCoupon code PRUEBA50", () =>
    p.promotionCoupon.findMany({ where: { code: { in: ["PRUEBA50"] } }, select: { id: true, code: true, usedCount: true } }),
  )
  await safe("MembershipCoupon code PRUEBA50", () =>
    p.membershipCoupon.findMany({ where: { code: { in: ["PRUEBA50"] } }, select: { id: true, code: true, redemptionCount: true } }),
  )
  await safe("Coupon (promo de negocio) DULCES20", () =>
    p.coupon.findMany({ where: { code: { in: ["DULCES20"] } }, select: { id: true, code: true, title: true, businessId: true } }),
  )
  await safe("MarketplaceListing con 'PRUEBA' en título", () =>
    p.marketplaceListing.findMany({ where: { title: { contains: "PRUEBA", mode: "insensitive" } }, select: { id: true, title: true, status: true } }),
  )
  await safe("Boost de prueba (Dulces Mexicanos)", () =>
    p.boost.findMany({
      where: { profile: { name: { contains: "Dulces Mexicanos", mode: "insensitive" } } },
      select: { id: true, pricePaid: true, status: true, startsAt: true, endsAt: true, profile: { select: { name: true } } },
    }),
  )
  await safe("Membresías de negocios de prueba (Scape / Dulces Mexicanos)", () =>
    p.profileMembership.findMany({
      where: { profile: { OR: [{ name: { contains: "Dulces Mexicanos", mode: "insensitive" } }, { owner: { name: { contains: "Scape", mode: "insensitive" } } }] } },
      select: { id: true, status: true, currentPeriodEnd: true, providerSubscriptionId: true, plan: { select: { name: true } }, profile: { select: { name: true } } },
    }),
  )
  await safe("Payments de prueba (test/PRUEBA)", () =>
    p.payment.findMany({
      where: { OR: [{ providerPaymentId: { contains: "cs_test", mode: "insensitive" } }, { metadata: { path: ["source"], equals: "stripe" } }] },
      select: { id: true, type: true, amount: true, provider: true, providerPaymentId: true, createdAt: true },
      take: 20,
    }),
  )
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
