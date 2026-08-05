// Aplica SOLO los cambios aditivos de los topes producto/servicio al DATABASE_URL
// actual (idempotente). Evita `prisma db push` a propósito: prod tiene drift previo
// (FKs, NOT NULL en isBoosted/isFounder) que db push arrastraría. Aquí se ejecutan
// únicamente las 4 sentencias nuevas + el backfill de datos.
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

async function main() {
  const db = prisma as unknown as { $executeRawUnsafe: (sql: string) => Promise<number> }

  // 1) Enum ListingType (guardado por si ya existe).
  await db.$executeRawUnsafe(
    `DO $$ BEGIN CREATE TYPE "ListingType" AS ENUM ('PRODUCT', 'SERVICE'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  )
  console.log("Enum ListingType OK")

  // 2) Columna listings.type (default PRODUCT).
  await db.$executeRawUnsafe(
    `ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "type" "ListingType" NOT NULL DEFAULT 'PRODUCT';`,
  )
  console.log("listings.type OK")

  // 3) Columna membership_plans.maxServices.
  await db.$executeRawUnsafe(
    `ALTER TABLE "membership_plans" ADD COLUMN IF NOT EXISTS "maxServices" INTEGER NOT NULL DEFAULT 0;`,
  )
  console.log("membership_plans.maxServices OK")

  // 4) Índice de apoyo para los conteos por tipo.
  await db.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "listings_businessId_type_idx" ON "listings"("businessId", "type");`,
  )
  console.log("index listings(businessId,type) OK")

  // 4b) Solicitudes de giro (apartado "¿No encuentras tu giro?").
  await db.$executeRawUnsafe(
    `DO $$ BEGIN CREATE TYPE "GiroSuggestionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED'); EXCEPTION WHEN duplicate_object THEN null; END $$;`,
  )
  await db.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "giro_suggestions" (
      "id" TEXT PRIMARY KEY,
      "name" TEXT NOT NULL,
      "note" TEXT,
      "categoryHint" TEXT,
      "businessName" TEXT,
      "contactEmail" TEXT,
      "userId" TEXT,
      "status" "GiroSuggestionStatus" NOT NULL DEFAULT 'PENDING',
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
  )
  await db.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "giro_suggestions_status_createdAt_idx" ON "giro_suggestions"("status", "createdAt");`,
  )
  console.log("tabla giro_suggestions OK")

  // 4c) Recordatorio de vencimiento de membresía (evita reenvíos diarios).
  await db.$executeRawUnsafe(
    `ALTER TABLE "business_memberships" ADD COLUMN IF NOT EXISTS "renewalNotifiedAt" TIMESTAMP(3);`,
  )
  console.log("business_memberships.renewalNotifiedAt OK")

  // 4d) Modelo de operación y metadata de giro (catálogo maestro).
  await db.$executeRawUnsafe(
    `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "operationModel" TEXT;`,
  )
  await db.$executeRawUnsafe(
    `ALTER TABLE "subcategories" ADD COLUMN IF NOT EXISTS "meta" JSONB;`,
  )
  console.log("businesses.operationModel + subcategories.meta OK")

  // 5) Backfill de valores de plan.
  const empren = await prisma.membershipPlan.updateMany({
    where: { slug: "emprendedor" },
    data: { maxListings: 50, maxServices: 50 },
  })
  const negocio = await prisma.membershipPlan.updateMany({
    where: { slug: "negocio" },
    data: { maxListings: 100, maxServices: 100 },
  })
  console.log(`Planes → emprendedor: ${empren.count}, negocio: ${negocio.count}`)

  // 6) Backfill type=SERVICE para publicaciones en categorías de servicios.
  const serviceCats = await prisma.category.findMany({
    where: { slug: { contains: "servicio" } },
    select: { id: true, slug: true },
  })
  const serviceCatIds = serviceCats.map((c) => c.id)
  if (serviceCatIds.length) {
    const res = await prisma.listing.updateMany({
      where: { categoryId: { in: serviceCatIds } },
      data: { type: "SERVICE" },
    })
    console.log(`Listings SERVICE: ${res.count} (cats: ${serviceCats.map((c) => c.slug).join(", ")})`)
  } else {
    console.log("Sin categorías de servicios; nada que backfillear.")
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
