export const dynamic = "force-dynamic"

import Link from "next/link"
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

  const businesses = await prisma.profile.findMany({
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
    ? await prisma.profileAnalyticsDaily.findMany({
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
      })
    : []
  // bizMap para lookup local del nombre sin include relacional (evita P2022)
  const bizMap = Object.fromEntries(businesses.map((b) => [b.id, { name: b.name }]))

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

  const kpis = [
    { label: "Vistas este mes", value: totalViews, icon: Eye, color: "text-green-700", href: "/dashboard/estadisticas" },
    { label: "Clics WhatsApp", value: totalWhatsAppClicks, icon: MessageCircle, color: "text-green-600", href: "/dashboard/leads" },
    { label: "Llamadas", value: totalPhoneClicks, icon: Phone, color: "text-orange-600", href: "/dashboard/leads" },
    { label: "Solicitudes de ruta", value: totalMapClicks, icon: MapPin, color: "text-red-600", href: "/dashboard/estadisticas" },
    { label: "Visitas al sitio web", value: totalWebsiteClicks, icon: Globe, color: "text-purple-600", href: "/dashboard/estadisticas" },
    { label: "Nuevos leads", value: totalLeads, icon: Users, color: "text-indigo-600", href: "/dashboard/leads" },
  ]

  const metrics = [
    { label: "Total visitas", value: String(totalViews), color: "text-green-700" },
    { label: "Total contactos", value: String(totalClicks), color: "text-green-600" },
    { label: "CTR", value: `${ctr}%`, color: "text-purple-600" },
    { label: "Conversión estimada", value: `${conversionRate}%`, color: "text-orange-600" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
        <p className="text-gray-500">Resumen de tu negocio en Guía ZMG</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <Link key={k.label} href={k.href} className="block">
              <Card className="h-full transition-shadow hover:border-green-200 hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">{k.label}</CardTitle>
                  <Icon className={`h-4 w-4 ${k.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{k.value}</div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Monthly Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <Link key={m.label} href="/dashboard/estadisticas" className="block">
            <Card className="h-full transition-shadow hover:border-green-200 hover:shadow-md">
              <CardContent className="p-5">
                <p className="text-sm text-gray-500">{m.label}</p>
                <p className={`text-2xl font-bold ${m.color}`}>{m.value}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
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
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Leads recientes</CardTitle>
            <Link href="/dashboard/leads" className="text-sm font-medium text-green-700 hover:text-green-900">
              Ver todos →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {leadsRecent.map((lead) => (
                <Link
                  key={lead.id}
                  href="/dashboard/leads"
                  className="flex items-center justify-between rounded-lg border-b px-2 py-2 transition-colors last:border-0 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">{bizMap[lead.businessId]?.name ?? lead.businessId}</p>
                    <p className="text-xs text-gray-500">{lead.type} · {lead.source}</p>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(lead.createdAt).toLocaleDateString("es-MX")}
                  </span>
                </Link>
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
            <Link
              href="/registrar-negocio"
              className="mt-4 inline-flex rounded-xl bg-green-800 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-green-900"
            >
              Registrar mi negocio
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
