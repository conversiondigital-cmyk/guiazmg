export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Package, Plus, Tag } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Marketplace | Guía ZMG" }

export default async function CuentaMarketplacePage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = (session.user as any).id

  const listings = await prisma.marketplaceListing.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, price: true, status: true,
      type: true, createdAt: true, municipalityId: true,
      images: { select: { imageUrl: true }, take: 1 },
    },
  })

  const STATUS_BADGE: Record<string, string> = {
    ACTIVE:   "bg-green-100 text-green-700",
    SOLD:     "bg-gray-100  text-gray-500",
    RESERVED: "bg-blue-100  text-blue-700",
    EXPIRED:  "bg-red-100   text-red-600",
    HIDDEN:   "bg-amber-100 text-amber-700",
  }
  const STATUS_LABEL: Record<string, string> = {
    ACTIVE: "Activo", SOLD: "Vendido", RESERVED: "Reservado", EXPIRED: "Expirado", HIDDEN: "Oculto",
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Package className="h-6 w-6 text-blue-600" />
            Marketplace
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{listings.length} publicaciones</p>
        </div>
        <Link
          href="/marketplace/nuevo"
          className="flex items-center gap-2 rounded-xl bg-green-800 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-900 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Publicar
        </Link>
      </div>

      {listings.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
          <Package className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">No tienes publicaciones activas</p>
          <p className="text-sm text-gray-400 mt-1">Publica lo que quieres vender, intercambiar o anunciar</p>
          <Link href="/marketplace/nuevo" className="mt-4 inline-flex rounded-xl bg-green-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-900 transition-colors">
            Crear publicación
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {listings.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white border border-gray-100 p-4 flex gap-4">
              <div className="h-16 w-16 shrink-0 rounded-xl bg-gray-100 overflow-hidden">
                {item.images[0]
                  ? <img src={item.images[0].imageUrl} alt={item.title} className="h-full w-full object-cover" />
                  : <div className="h-full w-full flex items-center justify-center"><Tag className="h-6 w-6 text-gray-300" /></div>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 line-clamp-1">{item.title}</p>
                {item.price && <p className="text-sm font-bold text-green-700 mt-0.5">${Number(item.price).toLocaleString("es-MX")} MXN</p>}
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_BADGE[item.status] ?? ""}`}>
                    {STATUS_LABEL[item.status] ?? item.status}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {new Date(item.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Browse link */}
      <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-100 p-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">¿Buscas algo específico?</p>
        <Link href="/marketplace" className="text-sm font-semibold text-green-700 hover:underline">
          Explorar marketplace →
        </Link>
      </div>
    </div>
  )
}
