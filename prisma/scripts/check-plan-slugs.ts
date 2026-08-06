// SOLO LECTURA: verifica que los planes en prod tengan los slugs que el webhook
// espera ("emprendedor" y "negocio"). Si no coinciden, un pago real no activaría
// la membresía (fulfillMembership busca por slug).
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

async function main() {
  const p = prisma as any
  const plans = await p.membershipPlan.findMany({
    select: { slug: true, name: true, monthlyPrice: true, maxListings: true, maxServices: true, isActive: true },
    orderBy: { monthlyPrice: "asc" },
  })
  console.log("== Planes en PROD ==")
  for (const pl of plans) console.log(JSON.stringify(pl))
  const slugs = new Set(plans.map((x: any) => x.slug))
  console.log("\n== Gate: slugs esperados por el webhook ==")
  for (const s of ["emprendedor", "negocio"]) {
    console.log(`  ${s}: ${slugs.has(s) ? "OK ✅" : "FALTA ❌ (el pago no activaría la membresía)"}`)
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
