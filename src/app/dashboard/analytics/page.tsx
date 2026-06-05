export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, MousePointerClick, TrendingUp, Calendar } from "@/lib/icons"

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  })

  const businessIds = businesses.map((b) => b.id)

  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const analyticsRows = businessIds.length > 0
    ? await prisma.businessAnalyticsDaily.findMany({
        where: { businessId: { in: businessIds } },
      })
    : []

  const totalViews = analyticsRows.reduce((sum, r) => sum + r.views, 0)
  const totalClicks = analyticsRows.reduce(
    (sum, r) =>
      sum + r.whatsappClicks + r.phoneClicks + r.websiteClicks + r.facebookClicks + r.instagramClicks + r.mapClicks,
    0
  )

  const recentRows = analyticsRows.filter((r) => r.date >= firstOfMonth)
  const recentViews = recentRows.reduce((sum, r) => sum + r.views, 0)
  const recentClicks = recentRows.reduce(
    (sum, r) =>
      sum + r.whatsappClicks + r.phoneClicks + r.websiteClicks + r.facebookClicks + r.instagramClicks + r.mapClicks,
    0
  )

  const viewsByBusiness = analyticsRows.reduce(
    (acc: Record<string, number>, r) => {
      acc[r.businessId] = (acc[r.businessId] || 0) + r.views
      return acc
    },
    {} as Record<string, number>
  )

  const clicksByType = analyticsRows.reduce(
    (acc: Record<string, number>, r) => {
      const types = ["whatsappClicks", "phoneClicks", "websiteClicks", "facebookClicks", "instagramClicks", "mapClicks"] as const
      for (const t of types) {
        const key = t.replace("Clicks", "")
        acc[key] = (acc[key] || 0) + r[t]
      }
      return acc
    },
    {} as Record<string, number>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analíticas</h1>
        <p className="text-gray-500">Rendimiento de tus perfiles en Guía ZMG</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Vistas totales</CardTitle>
            <Eye className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Clics totales</CardTitle>
            <MousePointerClick className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Vistas este mes</CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentViews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Clics este mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentClicks}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vistas por negocio</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(viewsByBusiness).length === 0 ? (
              <p className="text-sm text-gray-500">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {(Object.entries(viewsByBusiness) as [string, number][]).map(([bizId, views]) => {
                  const business = businesses.find((b) => b.id === bizId)
                  return (
                    <div key={bizId} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{business?.name || "Desconocido"}</span>
                      <span className="text-sm text-gray-500">{views} vistas</span>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clics por tipo</CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(clicksByType).length === 0 ? (
              <p className="text-sm text-gray-500">Sin datos aún</p>
            ) : (
              <div className="space-y-3">
                {(Object.entries(clicksByType) as [string, number][]).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm font-medium capitalize">{type}</span>
                    <span className="text-sm text-gray-500">{count} clics</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
