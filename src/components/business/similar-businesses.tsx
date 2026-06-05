import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin } from "@/lib/icons"
import { truncate } from "@/lib/utils"
import type { Business } from "@/types"

interface SimilarBusinessesProps {
  businesses: Business[]
}

export function SimilarBusinesses({ businesses }: SimilarBusinessesProps) {
  if (!businesses.length) return null

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Negocios similares</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {businesses.map((b) => (
          <Link key={b.id} href={`/perfil/${b.slug}`}>
            <Card className="group h-full transition-all hover:shadow-md hover:border-blue-200 cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 text-lg font-bold text-blue-600">
                    {b.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                      {b.name}
                    </h3>
                    {b.shortDescription && (
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2">
                        {truncate(b.shortDescription, 80)}
                      </p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      {b.municipality && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {b.municipality.name}
                        </span>
                      )}
                      {b.isVerified && (
                        <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">Verificado</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
