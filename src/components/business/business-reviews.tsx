"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Star, Loader2, Flag } from "lucide-react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { timeAgo, getInitials } from "@/lib/utils"
import type { Review } from "@/types"

interface BusinessReviewsProps {
  reviews: (Review & { user: { name: string | null; image: string | null } })[]
  businessId: string
  totalCount?: number
}

export function BusinessReviews({ reviews, businessId, totalCount }: BusinessReviewsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [loading, setLoading] = useState(false)
  const [hoveredStar, setHoveredStar] = useState(0)

  // Reporte de reseñas que violen las políticas (groserías, odio, spam…).
  const [reportingId, setReportingId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [reportDetail, setReportDetail] = useState("")
  const [reportLoading, setReportLoading] = useState(false)

  const REPORT_REASONS = [
    "Lenguaje ofensivo o groserías",
    "Discurso de odio o discriminación",
    "Spam o reseña falsa",
    "Datos personales o acoso",
    "Otro (contrario a las políticas)",
  ]

  const openReport = (reviewId: string) => {
    if (!session) {
      router.push("/auth/login")
      return
    }
    setReportingId((prev) => (prev === reviewId ? null : reviewId))
    setReportReason("")
    setReportDetail("")
  }

  const submitReport = async (reviewId: string) => {
    if (!reportReason) {
      toast.error("Elige un motivo")
      return
    }
    setReportLoading(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "review", id: reviewId, reason: reportReason, description: reportDetail }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "No se pudo enviar el reporte")
        return
      }
      toast.success("Reporte enviado. Nuestro equipo lo revisará.")
      setReportingId(null)
    } catch {
      toast.error("Error de conexión")
    } finally {
      setReportLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      router.push("/auth/login")
      return
    }
    if (rating === 0) {
      toast.error("Selecciona una calificación")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, rating, comment }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || "Error al enviar reseña")
        return
      }

      toast.success("¡Reseña publicada! Gracias por tu opinión")
      setRating(0)
      setComment("")
      router.refresh()
    } catch {
      toast.error("Error al enviar reseña")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Reseñas ({totalCount ?? reviews.length})
      </h2>

      <Card className="mb-6">
        <CardContent className="p-5">
          <h3 className="font-medium text-gray-900 mb-3">Deja tu reseña</h3>
          <div className="flex items-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                onMouseLeave={() => setHoveredStar(0)}
                className="p-0.5"
              >
                <Star
                  className={`h-6 w-6 transition-colors ${
                    star <= (hoveredStar || rating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-gray-300"
                  }`}
                />
              </button>
            ))}
          </div>
          <form onSubmit={handleSubmit}>
            <Textarea
              placeholder="Cuenta tu experiencia (opcional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              className="mb-3"
            />
            <Button type="submit" disabled={loading || rating === 0}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Enviar reseña
            </Button>
          </form>
        </CardContent>
      </Card>

      {reviews.length > 0 && (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs bg-green-100 text-green-700">
                      {review.user.name ? getInitials(review.user.name) : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900">
                        {review.user.name || "Anónimo"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {timeAgo(new Date(review.createdAt))}
                      </span>
                    </div>
                    <div className="flex items-center gap-0.5 mt-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3.5 w-3.5 ${
                            i < review.rating
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                    )}

                    <button
                      type="button"
                      onClick={() => openReport(review.id)}
                      className="mt-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-600"
                    >
                      <Flag className="h-3 w-3" />
                      Reportar
                    </button>

                    {reportingId === review.id && (
                      <div className="mt-3 space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
                        <p className="text-xs font-medium text-gray-700">
                          ¿Por qué reportas esta reseña?
                        </p>
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-sm"
                        >
                          <option value="">Selecciona un motivo…</option>
                          {REPORT_REASONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <Textarea
                          placeholder="Detalle (opcional)"
                          value={reportDetail}
                          onChange={(e) => setReportDetail(e.target.value)}
                          maxLength={500}
                          rows={2}
                        />
                        <div className="flex items-center gap-2">
                          <Button size="sm" onClick={() => submitReport(review.id)} disabled={reportLoading}>
                            {reportLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
                            Enviar reporte
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setReportingId(null)} disabled={reportLoading}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
