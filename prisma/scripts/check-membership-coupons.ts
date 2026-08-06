// SOLO LECTURA: lista los cupones de membresía (días gratis) en prod, con su plan.
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

async function main() {
  const p = prisma as any
  const rows = await p.membershipCoupon.findMany({
    select: {
      code: true, days: true, isActive: true, maxRedemptions: true,
      redemptionCount: true, expiresAt: true,
      plan: { select: { slug: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  })
  console.log("== MembershipCoupons en PROD ==")
  for (const r of rows) console.log(JSON.stringify(r))
  if (!rows.length) console.log("(no hay cupones de membresía)")
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
