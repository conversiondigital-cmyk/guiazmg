export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MessageCircle, Star, Reply } from "@/lib/icons"

export default async function ResenasPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  })
  const businessIds = businesses.map((b) => b.id)

  const reviews = businessIds.length > 0
    ? await prisma.review.findMany({
        where: { businessId: { in: businessIds } },
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { name: true, image: true } },
          business: { select: { name: true } },
          response: { include: { user: { select: { name: true } } } },
        },
      })
    : []

  const avgRating = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : "0"

  const ratingDistribution = [0, 0, 0, 0, 0]
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) ratingDistribution[r.rating - 1]++
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reseñas</h1>
        <p className="text-gray-500">Administra las reseñas de tus negocios</p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
              <Star className="h-7 w-7 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Calificación promedio</p>
              <p className="text-3xl font-bold text-gray-900">{avgRating}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-100">
              <MessageCircle className="h-7 w-7 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Número de reseñas</p>
              <p className="text-3xl font-bold text-gray-900">{reviews.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Distribución de calificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star - 1]
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="w-8 text-sm text-gray-600">{star} ★</span>
                  <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-400 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-xs text-gray-400 text-right">{count}</span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Todas las reseñas</CardTitle>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Aún no tienes reseñas</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">
                        {review.user.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{review.user.name || "Anónimo"}</p>
                        <p className="text-xs text-gray-400">{review.business.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${
                            i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{review.comment || "Sin comentario"}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {new Date(review.createdAt).toLocaleDateString("es-MX", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </span>
                    {review.status === "PENDING" && (
                      <Badge className="bg-yellow-100 text-yellow-700">Pendiente</Badge>
                    )}
                  </div>

                  {/* Response */}
                  {review.response && (
                    <div className="mt-3 rounded-lg bg-blue-50 p-3">
                      <div className="flex items-center gap-2 text-sm text-blue-600 mb-1">
                        <Reply className="h-3 w-3" />
                        <span className="font-medium">Respuesta del negocio</span>
                      </div>
                      <p className="text-sm text-gray-700">{review.response.response}</p>
                    </div>
                  )}

                  {/* Responder button */}
                  <Button variant="outline" size="sm" className="mt-3" disabled>
                    <Reply className="mr-2 h-3 w-3" />
                    Responder
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
