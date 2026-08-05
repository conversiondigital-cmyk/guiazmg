// Importa el catálogo maestro de giros (prisma/data/giros-catalog.json) al modelo
// del sistema: cada `categoria` del catálogo se mapea a una Category (reutiliza las
// existentes por slug o crea las nuevas) y cada `giro` se convierte en Subcategory
// con su metadata (perfil sugerido, modelo de operación, flags) en `meta` (JSON).
// Idempotente: se puede correr varias veces. NO borra ni desactiva lo existente.
// Respeta el DATABASE_URL del entorno (local o prod).
import "dotenv/config"
import { readFileSync } from "node:fs"
import { prisma } from "../../src/lib/prisma"

// catalogo.categoria -> { slug destino, nombre, icono }. Reutiliza los slugs ya
// sembrados (alimentacion, belleza, salud, hogar, construccion, automotriz,
// profesionales, educacion, compras, mascotas) y crea los nuevos.
const CATEGORY_MAP: Record<string, { slug: string; name: string; icon: string }> = {
  "Alimentos y Bebidas": { slug: "alimentacion", name: "Alimentación", icon: "🍽️" },
  "Belleza y Cuidado Personal": { slug: "belleza", name: "Belleza", icon: "💇" },
  Salud: { slug: "salud", name: "Salud", icon: "🏥" },
  "Deporte y Bienestar": { slug: "deporte-bienestar", name: "Deporte y Bienestar", icon: "🏋️" },
  "Servicios del Hogar": { slug: "hogar", name: "Hogar", icon: "🏠" },
  Construcción: { slug: "construccion", name: "Construcción", icon: "🏗️" },
  Automotriz: { slug: "automotriz", name: "Automotriz", icon: "🚗" },
  "Servicios Profesionales": { slug: "profesionales", name: "Profesionales", icon: "👔" },
  Tecnología: { slug: "tecnologia", name: "Tecnología", icon: "💻" },
  Educación: { slug: "educacion", name: "Educación", icon: "📚" },
  "Eventos y Espectáculos": { slug: "eventos", name: "Eventos y Espectáculos", icon: "🎉" },
  "Comercio y Tiendas": { slug: "compras", name: "Compras", icon: "🛍️" },
  Mascotas: { slug: "mascotas", name: "Mascotas", icon: "🐾" },
  Artesanías: { slug: "artesanias", name: "Artesanías", icon: "🎨" },
  "Venta por Catálogo": { slug: "venta-catalogo", name: "Venta por Catálogo", icon: "📦" },
  Reventa: { slug: "reventa", name: "Reventa", icon: "🏷️" },
  "Transporte y Logística": { slug: "transporte", name: "Transporte y Logística", icon: "🚚" },
  "Turismo y Hospedaje": { slug: "turismo", name: "Turismo y Hospedaje", icon: "🏨" },
}

type Row = {
  perfil: string; tipo: string; categoria: string; subcategoria: string; giro: string
  modelo: string; productos: string; servicios: string; marketplace: string; boost: string
  requiereUbicacion: string; aDomicilio: string; horario: string; slug: string
  keywords: string; sinonimos: string; icono: string; orden: number
}

const yes = (v: string) => v === "Sí"

async function main() {
  const rows: Row[] = JSON.parse(readFileSync("prisma/data/giros-catalog.json", "utf8"))

  // 1) Categorías destino (reutiliza existentes; no sobreescribe nombre/icono).
  const catId: Record<string, string> = {}
  let newCats = 0
  for (const [catalogCat, def] of Object.entries(CATEGORY_MAP)) {
    const existing = await prisma.category.findUnique({ where: { slug: def.slug }, select: { id: true } })
    if (existing) {
      catId[catalogCat] = existing.id
    } else {
      const c = await prisma.category.create({
        data: { slug: def.slug, name: def.name, icon: def.icon, isActive: true },
        select: { id: true },
      })
      catId[catalogCat] = c.id
      newCats++
    }
  }
  console.log(`Categorías: ${Object.keys(catId).length} destino (${newCats} nuevas)`)

  // 2) Giros → Subcategory con meta. Upsert por [categoryId, slug].
  let done = 0, skipped = 0
  const db = prisma as any
  for (const g of rows) {
    const cid = catId[g.categoria]
    if (!cid || !g.slug) { skipped++; continue }
    const meta = {
      perfil: g.perfil,
      tipo: g.tipo,
      modelo: g.modelo,
      grupo: g.subcategoria,
      prod: yes(g.productos),
      serv: yes(g.servicios),
      mkt: yes(g.marketplace),
      ubic: yes(g.requiereUbicacion),
      domic: yes(g.aDomicilio),
      horario: yes(g.horario),
      keywords: g.keywords || "",
      sinonimos: g.sinonimos || "",
      icono: g.icono || "",
    }
    await db.subcategory.upsert({
      where: { categoryId_slug: { categoryId: cid, slug: g.slug } },
      update: { name: g.giro, meta, sortOrder: g.orden ?? 0 },
      create: { categoryId: cid, name: g.giro, slug: g.slug, meta, isActive: true, sortOrder: g.orden ?? 0 },
    })
    done++
  }
  console.log(`Giros importados como subcategorías: ${done} (omitidos: ${skipped})`)
}

main()
  .then(() => process.exit(0))
  .catch((e) => { console.error(e); process.exit(1) })
