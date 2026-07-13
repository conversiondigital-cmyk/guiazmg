import Image from "next/image"
import { Package } from "@/lib/icons"
import { formatCurrency } from "@/lib/utils"

export interface CatalogItem {
  id: string
  title: string
  description: string | null
  price: number | null
  image: string | null
}

// Catálogo de productos del negocio en su perfil público. Se muestra solo si el
// negocio agregó al menos un producto activo (modelo Listing).
export function BusinessCatalog({ items }: { items: CatalogItem[] }) {
  if (!items.length) return null

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Productos y servicios</h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="overflow-hidden rounded-lg border border-gray-200">
            <div className="relative aspect-square bg-gray-50">
              {item.image ? (
                <Image src={item.image} alt={item.title} fill className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-300">
                  <Package className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="p-3">
              <h3 className="line-clamp-2 text-sm font-medium text-gray-900">{item.title}</h3>
              {item.description && (
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{item.description}</p>
              )}
              <p className="mt-2 text-sm font-semibold text-green-700">
                {item.price != null ? formatCurrency(item.price) : "Preguntar precio"}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
