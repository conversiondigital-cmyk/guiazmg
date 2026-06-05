import { Card, CardContent } from "@/components/ui/card"
import { Tag, Clock } from "@/lib/icons"
import type { Coupon } from "@/types"

interface BusinessPromotionsProps {
  promotions: Coupon[]
}

export function BusinessPromotions({ promotions }: BusinessPromotionsProps) {
  if (!promotions?.length) return null

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Promociones</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {promotions.map((promo) => (
          <Card key={promo.id} className="border-amber-200 bg-amber-50/50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 shrink-0">
                  <Tag className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{promo.title}</h3>
                  {promo.description && (
                    <p className="mt-1 text-sm text-gray-600">{promo.description}</p>
                  )}
                  {promo.code && (
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Código: </span>
                      <code className="rounded bg-amber-100 px-2 py-0.5 text-sm font-mono text-amber-800">
                        {promo.code}
                      </code>
                    </div>
                  )}
                  {promo.endDate && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      Válido hasta {new Date(promo.endDate).toLocaleDateString("es-MX")}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
