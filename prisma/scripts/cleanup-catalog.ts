// Limpieza del catálogo. Por defecto es DRY-RUN (no modifica nada); solo aplica
// con `--apply`. Idempotente. Corre contra la BD que apunte tu .env
// (para PRODUCCIÓN usa el DATABASE_URL de prod).
//
//   Ver plan:   npx tsx prisma/scripts/cleanup-catalog.ts
//   Aplicar:    npx tsx prisma/scripts/cleanup-catalog.ts --apply
//
// Hace dos cosas:
//   1) Desactiva (isActive=false) las categorías activas SIN ningún giro
//      (Restaurantes, Cafeterías, etc. quedaron vacías). Reversible.
//   2) Deduplica los slugs de subcategoría repetidos: conserva el primero y
//      sufija los demás (slug, slug-2, slug-3…) para que cada giro sea único.
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

async function main() {
  const apply = process.argv.includes("--apply")

  // 1) Categorías activas sin giros.
  const cats = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, _count: { select: { subcategories: true } } },
  })
  const empty = cats.filter((c) => c._count.subcategories === 0)
  console.log(`\n[1] Categorías vacías a desactivar (${empty.length}):`)
  empty.forEach((c) => console.log(`    - ${c.name}`))
  if (apply && empty.length) {
    await prisma.category.updateMany({ where: { id: { in: empty.map((c) => c.id) } }, data: { isActive: false } })
  }

  // 2) Slugs de subcategoría duplicados → sufijar los repetidos.
  const subs = await prisma.subcategory.findMany({ select: { id: true, slug: true, name: true }, orderBy: { id: "asc" } })
  const seen = new Map<string, number>()
  const fixes: { id: string; from: string; to: string; name: string }[] = []
  for (const s of subs) {
    const n = (seen.get(s.slug) ?? 0) + 1
    seen.set(s.slug, n)
    if (n > 1) fixes.push({ id: s.id, from: s.slug, to: `${s.slug}-${n}`, name: s.name })
  }
  console.log(`\n[2] Slugs de subcategoría duplicados a renombrar (${fixes.length}):`)
  fixes.forEach((f) => console.log(`    - "${f.name}": ${f.from} -> ${f.to}`))
  if (apply) {
    for (const f of fixes) {
      await prisma.subcategory.update({ where: { id: f.id }, data: { slug: f.to } }).catch((e) => console.error(f, e))
    }
  }

  console.log(apply ? "\n✅ Aplicado." : "\nDRY-RUN: nada se modificó. Corre con --apply para aplicar.")
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1) })
