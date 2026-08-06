// Uso LOCAL (dev): siembra los cupones de días gratis (REGALO30/60 por plan) para
// poder probar el autocompletado de la promo en el registro. Idempotente (upsert
// por code). Enlaza cada cupón al plan por slug. NO tocar en prod (allá ya existen).
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

const COUPONS = [
  { code: "REGALO60-EMPRENDE", days: 60, planSlug: "emprendedor" },
  { code: "REGALO60-NEGOCIO", days: 60, planSlug: "negocio" },
  { code: "REGALO30-EMPRENDE", days: 30, planSlug: "emprendedor" },
  { code: "REGALO30-NEGOCIO", days: 30, planSlug: "negocio" },
]

async function main() {
  for (const c of COUPONS) {
    const plan = await prisma.membershipPlan.findUnique({ where: { slug: c.planSlug } })
    if (!plan) {
      console.log(`SKIP ${c.code}: no existe el plan ${c.planSlug} en local`)
      continue
    }
    await prisma.membershipCoupon.upsert({
      where: { code: c.code },
      update: { days: c.days, planId: plan.id, isActive: true, maxRedemptions: 25 },
      create: { code: c.code, days: c.days, planId: plan.id, isActive: true, maxRedemptions: 25 },
    })
    console.log(`OK ${c.code} -> ${c.planSlug} (${c.days} días)`)
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
