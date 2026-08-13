"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Package, X } from "@/lib/icons"
import { formatCurrency } from "@/lib/utils"
import { priceUnitSuffix } from "@/lib/units"

export interface CatalogItem {
  id: string
  title: string
  description: string | null
  price: number | null
  unit?: string | null
  image: string | null
  type?: "PRODUCT" | "SERVICE"
  isBoosted?: boolean
}

// Cuántos se muestran antes del botón "Ver todos" (por grupo). Evita que un catálogo
// grande (hasta 100 por tipo) se vuelva un muro infinito en el perfil.
const INITIAL = 12

function Card({ item, onOpen }: { item: CatalogItem; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group overflow-hidden rounded-lg border border-gray-200 text-left transition-all hover:border-[#006c49]/40 hover:shadow-md"
    >
      <div className="relative aspect-square bg-gray-50">
        {item.isBoosted && (
          <span className="absolute left-2 top-2 z-10 rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-semibold text-amber-950 shadow">
            Destacado
          </span>
        )}
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover transition-transform duration-200 group-hover:scale-105"
            unoptimized
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1 text-gray-300">
            <Package className="h-7 w-7" />
            <span className="text-[10px] font-medium text-gray-400">Sin imagen</span>
          </div>
        )}
      </div>
      <div className="p-2.5">
        <h3 className="line-clamp-2 text-sm font-medium text-gray-900">{item.title}</h3>
        {item.description && <p className="mt-1 line-clamp-1 text-xs text-gray-500">{item.description}</p>}
        <p className="mt-1.5 text-sm font-semibold text-green-700">
          {item.price != null ? `${formatCurrency(item.price)}${priceUnitSuffix(item.unit)}` : "Preguntar precio"}
        </p>
      </div>
    </button>
  )
}

function Group({ title, items, onOpen }: { title: string; items: CatalogItem[]; onOpen: (i: CatalogItem) => void }) {
  const [showAll, setShowAll] = useState(false)
  const shown = showAll ? items : items.slice(0, INITIAL)
  const hasMore = items.length > INITIAL
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {title} <span className="font-normal text-gray-400">({items.length})</span>
      </h3>
      {/* Tarjetas más chicas: hasta 4 por fila en escritorio, menos scroll. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {shown.map((item) => (
          <Card key={item.id} item={item} onOpen={() => onOpen(item)} />
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-4 w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-[#006c49] transition-colors hover:bg-[#f0faf6]"
        >
          {showAll ? "Ver menos" : `Ver todos (${items.length})`}
        </button>
      )}
    </div>
  )
}

// Modal/visor: imagen grande + info del producto. Cierra con la X, clic afuera o Esc.
function Lightbox({ item, onClose }: { item: CatalogItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
        >
          <X className="h-5 w-5" />
        </button>
        <div className="relative aspect-square bg-gray-100">
          {item.image ? (
            <Image src={item.image} alt={item.title} fill className="object-contain" unoptimized />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-300">
              <Package className="h-12 w-12" />
              <span className="text-xs font-medium text-gray-400">Sin imagen</span>
            </div>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
          {item.description && <p className="mt-1 text-sm text-gray-600">{item.description}</p>}
          <p className="mt-3 text-xl font-bold text-green-700">
            {item.price != null ? `${formatCurrency(item.price)}${priceUnitSuffix(item.unit)}` : "Preguntar precio"}
          </p>
        </div>
      </div>
    </div>
  )
}

// Catálogo del negocio en su perfil público. Separa Productos y Servicios, cada uno
// ordenado (destacados primero, luego alfabético desde el servidor) y con "Ver todos".
// Las tarjetas se amplían en un visor al hacer clic.
export function BusinessCatalog({ items }: { items: CatalogItem[] }) {
  const [selected, setSelected] = useState<CatalogItem | null>(null)
  if (!items.length) return null
  const products = items.filter((i) => i.type !== "SERVICE")
  const services = items.filter((i) => i.type === "SERVICE")

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <h2 className="mb-5 text-lg font-semibold text-gray-900">Productos y servicios</h2>
      <div className="space-y-8">
        {products.length > 0 && <Group title="Productos" items={products} onOpen={setSelected} />}
        {services.length > 0 && <Group title="Servicios" items={services} onOpen={setSelected} />}
      </div>
      {selected && <Lightbox item={selected} onClose={() => setSelected(null)} />}
    </section>
  )
}
