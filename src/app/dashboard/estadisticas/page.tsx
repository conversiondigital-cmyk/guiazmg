export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Eye, Users, TrendingUp, Target, Search, Megaphone } from "@/lib/icons"
import { ViewsChart, LeadsChart } from "./analytics-charts"

export default async function EstadisticasPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  })
  const businessIds = businesses.map((b) => b.id)

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const analytics =
    businessIds.length > 0
      ? await prisma.businessAnalyticsDaily.findMany({
          where: { businessId: { in: businessIds }, date: { gte: thirtyDaysAgo } },
        })
      : []

  const leadsData =
    businessIds.length > 0
      ? await prisma.lead.findMany({
          where: { businessId: { in: businessIds }, createdAt: { gte: thirtyDaysAgo } },
          select: { id: true, createdAt: true },
        })
      : []

  const listings =
    businessIds.length > 0
      ? await prisma.listing.findMany({
          where: { businessId: { in: businessIds } },
          include: {
            business: { select: { name: true } },
            _count: { select: { leads: true, leadEvents: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : []

  const activeCoupons =
    businessIds.length > 0
      ? await prisma.coupon.findMany({
          where: {
            businessId: { in: businessIds },
            isActive: true,
            OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
          },
          include: { business: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : []

  const topKeywords = await prisma.searchLog.groupBy({
    by: ["query"],
    _count: { query: true },
    orderBy: { _count: { query: "desc" } },
    take: 10,
  })

  const totalViews = analytics.reduce((s, r) => s + r.views, 0)
  const totalClicks = analytics.reduce(
    (s, r) =>
      s +
      r.whatsappClicks +
      r.phoneClicks +
      r.websiteClicks +
      r.facebookClicks +
      r.instagramClicks +
      r.mapClicks +
      r.wazeClicks,
    0,
  )
  const totalLeads = leadsData.length
  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0"
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(2) : "0"

  const viewsMap = new Map<string, number>()
  for (const r of analytics) {
    const key = r.date.toISOString().slice(0, 10)
    viewsMap.set(key, (viewsMap.get(key) || 0) + r.views)
  }
  const dailyViewsData = [...viewsMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, views]) => ({ date: date.slice(5), views }))

  const leadsMap = new Map<string, number>()
  for (const l of leadsData) {
    const key = l.createdAt.toISOString().slice(0, 10)
    leadsMap.set(key, (leadsMap.get(key) || 0) + 1)
  }
  const dailyLeadsData = [...leadsMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date: date.slice(5), leads: count }))

  const topByViews = [...listings]
    .sort((a, b) => b._count.leadEvents - a._count.leadEvents)
    .slice(0, 5)

  const topByLeads = [...listings]
    .sort((a, b) => b._count.leads - a._count.leads)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Estadísticas</h1>
        <p className="text-gray-500">Métricas detalladas de tus negocios en los últimos 30 días</p>
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
            <CardTitle className="text-sm font-medium text-gray-500">Leads totales</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">CTR</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{ctr}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Conversión</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Vistas diarias</CardTitle>
            <CardDescription>Evolución de vistas en los últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyViewsData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin datos de vistas</p>
            ) : (
              <ViewsChart data={dailyViewsData} />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads por día</CardTitle>
            <CardDescription>Leads generados en los últimos 30 días</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyLeadsData.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin datos de leads</p>
            ) : (
              <LeadsChart data={dailyLeadsData} />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-500" />
              Anuncios más vistos
            </CardTitle>
            <CardDescription>Top 5 por visualizaciones</CardDescription>
          </CardHeader>
          <CardContent>
            {topByViews.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin anuncios</p>
            ) : (
              <div className="space-y-3">
                {topByViews.map((listing, i) => (
                  <div key={listing.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{listing.title}</p>
                        <p className="text-xs text-gray-500">{listing.business.name}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{listing._count.leadEvents} vistas</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-500" />
              Anuncios con más leads
            </CardTitle>
            <CardDescription>Top 5 por generación de leads</CardDescription>
          </CardHeader>
          <CardContent>
            {topByLeads.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin anuncios</p>
            ) : (
              <div className="space-y-3">
                {topByLeads.map((listing, i) => (
                  <div key={listing.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{listing.title}</p>
                        <p className="text-xs text-gray-500">{listing.business.name}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{listing._count.leads} leads</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-orange-500" />
              Promociones activas
            </CardTitle>
            <CardDescription>Cupones y ofertas vigentes</CardDescription>
          </CardHeader>
          <CardContent>
            {activeCoupons.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No hay promociones activas</p>
            ) : (
              <div className="space-y-3">
                {activeCoupons.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.title}</p>
                      <p className="text-xs text-gray-500">{c.business.name}</p>
                      {c.description && <p className="text-xs text-gray-400 mt-1">{c.description}</p>}
                    </div>
                    <Badge className="bg-green-100 text-green-700">Activa</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5 text-gray-500" />
              Búsquedas populares
            </CardTitle>
            <CardDescription>Palabras clave más buscadas en Guía ZMG</CardDescription>
          </CardHeader>
          <CardContent>
            {topKeywords.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Sin búsquedas aún</p>
            ) : (
              <div className="space-y-3">
                {topKeywords.map((kw, i) => (
                  <div key={kw.query} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-5">{i + 1}</span>
                      <span className="text-sm text-gray-900">{kw.query}</span>
                    </div>
                    <Badge variant="outline">{kw._count.query} veces</Badge>
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
