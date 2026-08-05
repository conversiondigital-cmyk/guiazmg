// Migración de datos para los topes separados producto/servicio.
//  1) Ajusta los planes existentes: Emprendimiento 50/50, Negocio 100/100.
//  2) Marca como SERVICE las publicaciones cuya categoría es de servicios
//     (slug contiene "servicio"); el resto queda PRODUCT (default de la columna).
// Idempotente: se puede correr varias veces. Respeta el DATABASE_URL del entorno.
import "dotenv/config"
import { prisma } from "../../src/lib/prisma"

async function main() {
  // 1) Planes.
  const empren = await prisma.membershipPlan.updateMany({
    where: { slug: "emprendedor" },
    data: { maxListings: 50, maxServices: 50 },
  })
  const negocio = await prisma.membershipPlan.updateMany({
    where: { slug: "negocio" },
    data: { maxListings: 100, maxServices: 100 },
  })
  console.log(`Planes actualizados → emprendedor: ${empren.count}, negocio: ${negocio.count}`)

  // 2) Backfill de type=SERVICE por categoría de servicios.
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
    console.log(
      `Listings marcados SERVICE: ${res.count} (categorías: ${serviceCats.map((c) => c.slug).join(", ")})`,
    )
  } else {
    console.log("No se encontraron categorías de servicios; nada que backfillear.")
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
