export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Phone, TrendingUp, MapPin, Globe, Users, MessageCircle } from "@/lib/icons"
import { DashboardCharts } from "@/components/dashboard/charts"
import { ProfileScoreCard } from "@/components/dashboard/profile-score"
import { NotificationsPanel } from "@/components/dashboard/notifications"
import { GamificationTips } from "@/components/dashboard/gamification"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.user.id },
    include: {
      memberships: { include: { plan: true } },
      _count: { select: { reviews: true } },
    },
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const businessIds = businesses.map((b) => b.id)
  const analyticsRows = businessIds.length > 0
    ? await prisma.businessAnalyticsDaily.findMany({
        where: { businessId: { in: businessIds } },
      })
    : []

  const totalViews = analyticsRows.reduce((sum, r) => sum + r.views, 0)
  const totalWhatsAppClicks = analyticsRows.reduce((sum, r) => sum + r.whatsappClicks, 0)
  const totalPhoneClicks = analyticsRows.reduce((sum, r) => sum + r.phoneClicks, 0)
  const totalWebsiteClicks = analyticsRows.reduce((sum, r) => sum + r.websiteClicks, 0)
  const totalMapClicks = analyticsRows.reduce((sum, r) => sum + r.mapClicks, 0)
  const totalClicks = totalWhatsAppClicks + totalPhoneClicks + totalWebsiteClicks + totalMapClicks +
    analyticsRows.reduce((s, r) => s + r.facebookClicks + r.instagramClicks, 0)
  const totalLeads = businessIds.length > 0
    ? await prisma.lead.count({ where: { businessId: { in: businessIds } } })
    : 0

  const leadsRecent = businessIds.length > 0
    ? await prisma.lead.findMany({
        where: { businessId: { in: businessIds } },
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { business: { select: { name: true } } },
      })
    : []

  const recentNotifications = businessIds.length > 0
    ? await prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : []

  const ctr = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0"
  const conversionRate = totalViews > 0 ? ((totalLeads / totalViews) * 100).toFixed(1) : "0"

  const chartData = analyticsRows.reduce((acc: any[], r) => {
    const existing = acc.find((a: any) => a.date === r.date.toISOString().split("T")[0])
    if (existing) {
      existing.views += r.views
      existing.whatsappClicks += r.whatsappClicks
      existing.phoneClicks += r.phoneClicks
      existing.websiteClicks += r.websiteClicks
      existing.mapClicks += r.mapClicks
    } else {
      acc.push({
        date: r.date.toISOString().split("T")[0],
        views: r.views,
        whatsappClicks: r.whatsappClicks,
        phoneClicks: r.phoneClicks,
        websiteClicks: r.websiteClicks,
        mapClicks: r.mapClicks,
      })
    }
    return acc
  }, []).sort((a: any, b: any) => a.date.localeCompare(b.date))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-gray-500">Resumen de tu negocio en Guía ZMG</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Vistas este mes</CardTitle>
            <Eye className="h-4 w-4 text-green-700" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalViews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Clics WhatsApp</CardTitle>
            <MessageCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWhatsAppClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Llamadas</CardTitle>
            <Phone className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPhoneClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Solicitudes de ruta</CardTitle>
            <MapPin className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMapClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Visitas al sitio web</CardTitle>
            <Globe className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalWebsiteClicks}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Nuevos leads</CardTitle>
            <Users className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads}</div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Total visitas</p>
            <p className="text-2xl font-bold text-green-700">{totalViews}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Total contactos</p>
            <p className="text-2xl font-bold text-green-600">{totalClicks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">CTR</p>
            <p className="text-2xl font-bold text-purple-600">{ctr}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Conversión estimada</p>
            <p className="text-2xl font-bold text-orange-600">{conversionRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Notifications */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <DashboardCharts data={chartData} />
        </div>
        <div className="space-y-6">
          <NotificationsPanel notifications={recentNotifications as any} />
          <GamificationTips />
          <ProfileScoreCard business={businesses[0] as any} />
        </div>
      </div>

      {/* Recent Leads */}
      {leadsRecent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Leads recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leadsRecent.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lead.business.name}</p>
                    <p className="text-xs text-gray-500">{lead.type} · {lead.source}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(lead.createdAt).toLocaleDateString("es-MX")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {businesses.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-300" />
            <h2 className="mt-4 text-lg font-semibold text-gray-900">No tienes negocios registrados</h2>
            <p className="mt-2 text-sm text-gray-500">
              Registra tu negocio en Guía ZMG y comienza a recibir clientes.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
