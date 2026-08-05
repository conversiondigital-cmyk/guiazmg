// Fase B — limpieza de taxonomía. Desactiva (NO borra) las subcategorías VIEJAS
// (las sembradas/demo, que no vienen del catálogo maestro: su `meta` es NULL) para
// que el registro muestre solo los giros del catálogo. Los negocios existentes
// conservan su subcategoryId (la relación sigue intacta), así que no se rompe nada.
// Además desactiva categorías que quedaron SIN subcategorías activas y SIN negocios.
// Idempotente. Respeta el DATABASE_URL del entorno (local o prod).
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

async function main() {
  const db = prisma as unknown as { $executeRawUnsafe: (sql: string) => Promise<number> }

  // 1) Subcategorías viejas (meta NULL) → isActive=false. Raw SQL: el filtrado de
  //    JSON NULL en Prisma es ambiguo; en SQL "meta IS NULL" es inequívoco.
  const deact = await db.$executeRawUnsafe(
    `UPDATE "subcategories" SET "isActive" = false WHERE "meta" IS NULL AND "isActive" = true;`,
  )
  console.log(`Subcategorías viejas desactivadas: ${deact}`)

  // 2) Categorías activas que quedaron sin subcategorías activas.
  const cats = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, slug: true, name: true },
  })
  let emptiedDeactivated = 0
  for (const c of cats) {
    const activeSubs = await prisma.subcategory.count({ where: { categoryId: c.id, isActive: true } })
    if (activeSubs > 0) continue
    const businesses = await prisma.profile.count({ where: { categoryId: c.id, deletedAt: null } })
    if (businesses === 0) {
      await prisma.category.update({ where: { id: c.id }, data: { isActive: false } })
      emptiedDeactivated++
      console.log(`Categoría vacía desactivada: ${c.slug} (${c.name})`)
    } else {
      console.log(`Categoría vacía CONSERVADA (tiene ${businesses} negocios): ${c.slug} (${c.name})`)
    }
  }
  console.log(`Categorías vacías desactivadas: ${emptiedDeactivated}`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
