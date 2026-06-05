export const dynamic = "force-dynamic"

import Link from "next/link"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { prisma } from "@/lib/prisma"
import { Plus, MapPin, MessageCircle, Calendar, ChevronRightIcon } from "@/lib/icons"

export default async function SolicitudesPage() {
  const requests = await prisma.serviceRequest.findMany({
    where: { status: "ACTIVE" },
    include: {
      user: { select: { name: true, image: true } },
      category: { select: { name: true, slug: true, icon: true } },
      municipality: { select: { name: true } },
      _count: { select: { responses: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Solicitudes</h1>
              <p className="mt-1 text-gray-500">Vecinos buscando servicios en tu zona</p>
            </div>
            <Link href="/marketplace/nuevo?type=REQUEST">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Publicar solicitud
              </Button>
            </Link>
          </div>

          {requests.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-gray-200 p-16 text-center">
              <p className="text-gray-400 text-lg">No hay solicitudes activas</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((req) => (
                <Card key={req.id} className="group hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {req.category && (
                            <Badge variant="outline" className="text-xs">
                              {req.category.icon && <span className="mr-1">{req.category.icon}</span>}
                              {req.category.name}
                            </Badge>
                          )}
                          <Badge className="bg-blue-100 text-blue-700 text-xs">Solicitud</Badge>
                        </div>
                        <h2 className="text-lg font-semibold text-gray-900">{req.title}</h2>
                        {req.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{req.description}</p>
                        )}
                        <div className="mt-3 flex items-center gap-4 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(req.createdAt).toLocaleDateString("es-MX")}
                          </span>
                          {req.municipality && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {req.municipality.name}
                              {req.neighborhood && ` · ${req.neighborhood}`}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <MessageCircle className="h-3 w-3" />
                            {req._count.responses} respuestas
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{req.user.name || "Anónimo"}</p>
                        </div>
                        <ChevronRightIcon className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
