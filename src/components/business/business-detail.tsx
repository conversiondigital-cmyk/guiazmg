import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { MapPin, Clock, Tag, Star } from "@/lib/icons"
import type { Business } from "@/types"

interface BusinessDetailProps {
  business: Business
  avgRating: number
  reviewCount?: number
}

export function BusinessDetail({ business, avgRating, reviewCount }: BusinessDetailProps) {
  const totalReviews = reviewCount ?? business.reviews?.length ?? 0
  const activeMembership = business.memberships?.find((m) => m.status === "ACTIVE")

  return (
    <div>
      {business.coverImageUrl && (
        <div className="relative aspect-[16/9] rounded-2xl overflow-hidden mb-6 bg-gradient-to-br from-green-100 to-green-50">
          <Image src={business.coverImageUrl} alt={business.name} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        </div>
      )}

      <div className="flex items-start gap-4">
        {business.logoUrl && (
          <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
            <Image src={business.logoUrl} alt={business.name} fill className="object-cover" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
            {business.isVerified && (
              <Badge className="bg-green-700 text-white">Verificado</Badge>
            )}
            {activeMembership && (
              <Badge className="bg-amber-500 text-white">{activeMembership.plan.name}</Badge>
            )}
          </div>
          {business.shortDescription && (
            <p className="mt-2 text-gray-600">{business.shortDescription}</p>
          )}
          {avgRating > 0 && (
            <div className="mt-2 flex items-center gap-1 text-sm">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-medium">{avgRating.toFixed(1)}</span>
              <span className="text-gray-500">
                ({totalReviews} reseña{totalReviews !== 1 ? "s" : ""})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {business.description && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Acerca de</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">
              {business.description}
            </p>
          </div>
        )}

        {business.tags && business.tags.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Etiquetas</h2>
            <div className="flex flex-wrap gap-2">
              {business.tags.map((bt) => (
                <Badge key={bt.tag.id} variant="secondary">
                  <Tag className="mr-1 h-3 w-3" />
                  {bt.tag.name}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {business.addressText && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Ubicación</h2>
            <div className="flex items-start gap-2 text-gray-600">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p>{business.addressText}</p>
                {business.municipality && (
                  <p className="text-sm">
                    {business.municipality.name}
                    {business.neighborhood && `, Col. ${business.neighborhood.name}`}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {business.hours && business.hours.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Horario</h2>
            <div className="flex items-start gap-2 text-gray-600">
              <Clock className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
              <div className="text-sm">
                {business.hours.map((h) => (
                  <div key={h.dayOfWeek} className="flex gap-4">
                    <span className="font-medium w-24">
                      {["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][h.dayOfWeek]}:
                    </span>
                    <span>{h.isClosed ? "Cerrado" : `${h.opensAt} - ${h.closesAt}`}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
