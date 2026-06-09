export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { Star } from "lucide-react"
import { Metadata } from "next"

export const metadata: Metadata = { title: "Mis reseñas | Guía ZMG" }

export default async function MisResenasPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = (session.user as any).id

  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      business: { select: { id: true, name: true, slug: true, logoUrl: true } },
    },
  })

  const STATUS_BADGE: Record<string, string> = {
    PENDING:  "bg-amber-100 text-amber-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100   text-red-700",
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
          Mis reseñas
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">{reviews.length} reseñas escritas</p>
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-2xl bg-white border border-gray-100 p-16 text-center">
          <Star className="h-12 w-12 text-gray-200 mx-auto mb-3" />
          <p className="font-semibold text-gray-700">Aún no has escrito reseñas</p>
          <p className="text-sm text-gray-400 mt-1">Ayuda a otros usuarios calificando los negocios que visitas</p>
          <Link href="/search" className="mt-4 inline-flex rounded-xl bg-green-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-green-900 transition-colors">
            Explorar negocios
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-2xl bg-white border border-gray-100 p-5">
              <div className="flex items-start gap-4">
                <Link href={`/negocio/${review.business.slug}`} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gray-100 overflow-hidden hover:opacity-80 transition-opacity">
                  {review.business.logoUrl
                    ? <img src={review.business.logoUrl} alt={review.business.name} className="h-full w-full object-cover" />
                    : <span className="text-lg font-black text-gray-300">{review.business.name.charAt(0)}</span>
                  }
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <Link href={`/negocio/${review.business.slug}`} className="font-bold text-gray-900 hover:text-green-800 line-clamp-1">
                      {review.business.name}
                    </Link>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_BADGE[review.status] ?? ""}`}>
                      {review.status === "PENDING" ? "Pendiente" : review.status === "APPROVED" ? "Aprobada" : "Rechazada"}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < (review.rating ?? 0) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                    ))}
                  </div>
                  {review.comment && <p className="text-sm text-gray-600 mt-2 leading-relaxed">{review.comment}</p>}
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(review.createdAt).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
