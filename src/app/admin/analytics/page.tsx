import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  Users, Store, ShoppingBag, Search,
  MapPin, Eye, DollarSign, Target, Activity, Zap, Tag, BarChart3,
} from "@/lib/icons"
import { CHANNEL_LABELS, type TrafficChannel } from "@/lib/analytics/traffic"
import { getTopSearchKeywords } from "@/lib/seo/search-console"
import { getGa4Summary } from "@/lib/analytics/ga4"

export const dynamic = "force-dynamic"

function fillDailyData(rows: { date: Date; count: number }[], days: number): { date: string; count: number }[] {
  const map = new Map<string, number>()
  const now = new Date()
  for (const r of rows) {
    const key = new Date(r.date).toISOString().slice(0, 10)
    map.set(key, r.count)
  }
  const result: { date: string; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    result.push({ date: d.toISOString().slice(0, 10), count: map.get(d.toISOString().slice(0, 10)) || 0 })
  }
  return result
}

function fillMonthlyData(rows: { date: Date; amount: number }[], months: number): { month: string; amount: number }[] {
  const map = new Map<string, number>()
  const now = new Date()
  for (const r of rows) {
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`
    map.set(key, r.amount)
  }
  const result: { month: string; amount: number }[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    result.push({ month: key, amount: map.get(key) || 0 })
  }
  return result
}

export default async function AdminAnalyticsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(now.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const [
    totalUsers,
    activeBusinesses,
    activeMarketplace,
    totalLeads,
    approvedPaymentsAgg,
    totalSearches,
    totalViews,
    dailyVisitRows,
    dailyLeadRows,
    monthlyRevenueRows,
    topSearches,
    topSearchedCategories,
    topNeighborhoods,
    topMunicipalities,
    visitsByChannel,
    topSources,
    topLandings,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.profile.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.marketplaceListing.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.lead.count(),
    prisma.payment.aggregate({ where: { status: "APPROVED" }, _sum: { amount: true } }),
    prisma.searchLog.count(),
    prisma.profileAnalyticsDaily.aggregate({ _sum: { views: true } }),
    prisma.$queryRaw<{ date: Date; count: number }[]>`
      SELECT date, SUM(views)::int as count
      FROM business_analytics_daily
      WHERE date >= ${thirtyDaysAgo}
      GROUP BY date ORDER BY date
    `,
    prisma.$queryRaw<{ date: Date; count: number }[]>`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM leads
      WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt") ORDER BY date
    `,
    prisma.$queryRaw<{ date: Date; amount: number }[]>`
      SELECT
        DATE_TRUNC('month', "createdAt") as date,
        SUM(amount)::numeric::int as amount
      FROM payments
      WHERE status = 'APPROVED' AND "createdAt" >= ${twelveMonthsAgo}
      GROUP BY DATE_TRUNC('month', "createdAt") ORDER BY date
    `,
    prisma.$queryRaw<{ query: string; count: number }[]>`
      SELECT query, COUNT(*)::int as count
      FROM search_logs
      GROUP BY query ORDER BY count DESC LIMIT 10
    `,
    prisma.$queryRaw<{ name: string; count: number }[]>`
      SELECT c.name, COUNT(sl.id)::int as count
      FROM search_logs sl
      JOIN categories c ON LOWER(sl.query) LIKE '%' || LOWER(c.name) || '%'
      GROUP BY c.name ORDER BY count DESC LIMIT 10
    `,
    prisma.$queryRaw<{
      name: string; municipality: string; views: number; leads: number
    }[]>`
      SELECT
        n.name, m.name as municipality,
        COALESCE(SUM(bad.views), 0)::int as views,
        COALESCE(l.leads, 0)::int as leads
      FROM neighborhoods n
      JOIN municipalities m ON m.id = n."municipalityId"
      LEFT JOIN businesses b ON b."neighborhoodId" = n.id AND b."deletedAt" IS NULL
      LEFT JOIN business_analytics_daily bad ON bad."businessId" = b.id
      LEFT JOIN (SELECT "businessId", COUNT(*)::int as leads FROM leads GROUP BY "businessId") l ON l."businessId" = b.id
      WHERE n."isActive" = true
      GROUP BY n.id, n.name, m.name, l.leads
      ORDER BY views DESC LIMIT 10
    `,
    prisma.$queryRaw<{ name: string; views: number; leads: number }[]>`
      SELECT
        m.name,
        COALESCE(SUM(bad.views), 0)::int as views,
        COALESCE(l.leads, 0)::int as leads
      FROM municipalities m
      LEFT JOIN neighborhoods n ON n."municipalityId" = m.id
      LEFT JOIN businesses b ON b."neighborhoodId" = n.id AND b."deletedAt" IS NULL
      LEFT JOIN business_analytics_daily bad ON bad."businessId" = b.id
      LEFT JOIN (SELECT "businessId", COUNT(*)::int as leads FROM leads GROUP BY "businessId") l ON l."businessId" = b.id
      GROUP BY m.id, m.name, l.leads
      ORDER BY views DESC LIMIT 10
    `,
    prisma.pageVisit.groupBy({
      by: ["channel"],
      _count: { _all: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    }),
    prisma.pageVisit.groupBy({
      by: ["source"],
      _count: { _all: true },
      where: { createdAt: { gte: thirtyDaysAgo }, source: { not: null } },
      orderBy: { _count: { source: "desc" } },
      take: 10,
    }),
    prisma.pageVisit.groupBy({
      by: ["path"],
      _count: { _all: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
      orderBy: { _count: { path: "desc" } },
      take: 10,
    }),
  ])

  // Tráfico: canales de entrada (últimos 30 días)
  const channelOrder: TrafficChannel[] = ["ORGANIC", "DIRECT", "SOCIAL", "REFERRAL", "CAMPAIGN"]
  const channelCounts = new Map<string, number>(
    (visitsByChannel as { channel: string; _count: { _all: number } }[]).map((r) => [r.channel, r._count._all])
  )
  const totalVisitsTracked = Array.from(channelCounts.values()).reduce((s, n) => s + n, 0)
  const channels = channelOrder
    .map((c) => ({ channel: c, label: CHANNEL_LABELS[c], count: channelCounts.get(c) || 0 }))
    .filter((c) => c.count > 0)

  // Palabras clave reales de Google (null si Search Console no está conectado).
  const googleKeywords = await getTopSearchKeywords()

  // Resumen de Google Analytics 4 (null si no está conectado). Reutiliza la cuenta
  // de servicio de Search Console + el ID de propiedad GA4.
  const ga4 = await getGa4Summary(28)
  const fmtDuration = (sec: number) => {
    const s = Math.round(sec)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`
  }
  const ga4HasData = !!ga4 && (ga4.totals.sessions > 0 || ga4.totals.activeUsers > 0 || ga4.countries.length > 0)
  const ga4Kpis: { label: string; value: string; trend?: number | null }[] = ga4
    ? [
        { label: "Usuarios activos", value: ga4.totals.activeUsers.toLocaleString(), trend: ga4.usersTrendPct },
        { label: "Sesiones", value: ga4.totals.sessions.toLocaleString() },
        { label: "Vistas de página", value: ga4.totals.pageViews.toLocaleString() },
        { label: "Interacción", value: `${(ga4.totals.engagementRate * 100).toFixed(0)}%` },
        { label: "Duración media", value: fmtDuration(ga4.totals.avgSessionSec) },
      ]
    : []
  const ga4Breakdowns = ga4
    ? [
        { title: "Países", items: ga4.countries },
        { title: "Dispositivos", items: ga4.devices },
        { title: "Sistemas operativos", items: ga4.os },
        { title: "Navegadores", items: ga4.browsers },
      ]
    : []

  // ── Resumen de tráfico estilo panel (datos propios: page_visits) ─────────────
  const sixtyDaysAgo = new Date(thirtyDaysAgo)
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 30)
  const [pageViews30, pageViewsPrev30, dailyPvRows] = await Promise.all([
    prisma.pageVisit.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.pageVisit.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
    prisma.$queryRaw<{ date: Date; count: number }[]>`
      SELECT DATE("createdAt") as date, COUNT(*)::int as count
      FROM page_visits WHERE "createdAt" >= ${thirtyDaysAgo}
      GROUP BY DATE("createdAt") ORDER BY date
    `,
  ])
  const pvTrend = pageViewsPrev30 > 0 ? Math.round(((pageViews30 - pageViewsPrev30) / pageViewsPrev30) * 100) : null
  const pvSeries = fillDailyData(dailyPvRows as { date: Date; count: number }[], 30)
  const pvMax = Math.max(...pvSeries.map((d) => d.count), 1)
  // Geometría de la gráfica de área (SVG con viewBox; escala responsiva).
  const CW = 720, CH = 130, CP = 6
  const pvStepX = (CW - CP * 2) / Math.max(pvSeries.length - 1, 1)
  const pvPts = pvSeries.map((d, i) => [CP + i * pvStepX, CH - CP - (d.count / pvMax) * (CH - CP * 2)] as const)
  const pvLine = pvPts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ")
  const pvArea = `${pvLine} L${pvPts[pvPts.length - 1][0].toFixed(1)} ${CH - CP} L${pvPts[0][0].toFixed(1)} ${CH - CP} Z`
  const chOrganic = channelCounts.get("ORGANIC") || 0
  const chDirect = channelCounts.get("DIRECT") || 0
  const chSocial = channelCounts.get("SOCIAL") || 0

  const monthlyRevenue = Number(approvedPaymentsAgg._sum.amount ?? 0)
  const visitsCount = totalViews._sum.views ?? 0
  const conversionRate = visitsCount > 0 ? ((totalLeads / visitsCount) * 100).toFixed(2) : "0.00"

  const chartVisits = fillDailyData(dailyVisitRows as { date: Date; count: number }[], 30)
  const chartLeads = fillDailyData(dailyLeadRows as { date: Date; count: number }[], 30)
  const revenueBars = fillMonthlyData(monthlyRevenueRows as { date: Date; amount: number }[], 12)

  const maxVisit = Math.max(...chartVisits.map((d) => d.count), 1)
  const maxLead = Math.max(...chartLeads.map((d) => d.count), 1)
  const maxRevenue = Math.max(...revenueBars.map((d) => d.amount), 1)

  const funnel = [
    { label: "Visitantes", value: visitsCount, pct: 100 },
    { label: "Búsquedas", value: totalSearches, pct: visitsCount > 0 ? Math.round((totalSearches / visitsCount) * 100) : 0 },
    { label: "Clics", value: visitsCount, pct: visitsCount > 0 ? 100 : 0 },
    { label: "Leads", value: totalLeads, pct: visitsCount > 0 ? Math.round((totalLeads / visitsCount) * 100) : 0 },
    { label: "Conversión", value: `${conversionRate}%`, pct: Math.min(Number(conversionRate), 100) },
  ]

  const kpiItems = [
    { label: "Visitas totales", value: visitsCount, icon: Eye, color: "from-blue-500/20 to-blue-600/10 text-blue-600" },
    { label: "Leads generados", value: totalLeads, icon: Target, color: "from-cyan-500/20 to-cyan-600/10 text-cyan-600" },
    { label: "Tasa conversión", value: `${conversionRate}%`, icon: Activity, color: "from-emerald-500/20 to-emerald-600/10 text-emerald-600" },
    { label: "Ingresos del mes", value: `$${monthlyRevenue.toLocaleString()}`, icon: DollarSign, color: "from-green-500/20 to-green-600/10 text-green-600" },
    { label: "Usuarios registrados", value: totalUsers, icon: Users, color: "from-purple-500/20 to-purple-600/10 text-purple-600" },
    { label: "Negocios activos", value: activeBusinesses, icon: Store, color: "from-orange-500/20 to-orange-600/10 text-orange-600" },
    { label: "Marketplace", value: activeMarketplace, icon: ShoppingBag, color: "from-pink-500/20 to-pink-600/10 text-pink-600" },
  ]

  return (
    <div className="space-y-8 p-6 lg:p-8">
      <h1 className="text-2xl font-bold tracking-tight">Executive Analytics</h1>

      {/* Resumen de tráfico (estilo panel) — métricas grandes + área + páginas/referencias */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-medium">Resumen de tráfico (30 días)</h3>
          </div>
          <span className="text-[10px] text-muted-foreground">Datos propios del sitio · GA4 amplía esto al conectarlo</span>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold tracking-tight">{pageViews30.toLocaleString()}</p>
              {pvTrend !== null && (
                <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${pvTrend >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {pvTrend >= 0 ? "+" : ""}{pvTrend}%
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">Vistas de página</p>
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight">{chOrganic.toLocaleString()}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Desde buscadores</p>
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight">{chSocial.toLocaleString()}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Desde redes</p>
          </div>
          <div>
            <p className="text-3xl font-bold tracking-tight">{chDirect.toLocaleString()}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Directo</p>
          </div>
        </div>

        <div className="mt-5">
          <svg viewBox={`0 0 ${CW} ${CH}`} preserveAspectRatio="none" className="h-32 w-full" role="img" aria-label="Vistas de página por día">
            <defs>
              <linearGradient id="pvGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={pvArea} fill="url(#pvGrad)" />
            <path d={pvLine} fill="none" stroke="#2563EB" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
            <span>{pvSeries[0]?.date.slice(5)}</span>
            <span>Total: {pageViews30.toLocaleString()} vistas</span>
            <span>{pvSeries[pvSeries.length - 1]?.date.slice(5)}</span>
          </div>
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">Páginas</h4>
            <div className="space-y-0.5">
              {(topLandings as { path: string; _count: { _all: number } }[]).slice(0, 6).map((p) => (
                <div key={p.path} className="flex items-center justify-between rounded px-2 py-1.5 text-sm odd:bg-muted/30">
                  <span className="truncate font-medium">{p.path}</span>
                  <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">{p._count._all}</span>
                </div>
              ))}
              {(topLandings as unknown[]).length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">Sin datos aún</p>
              )}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-medium text-muted-foreground">Referencias / Fuentes</h4>
            <div className="space-y-0.5">
              {(topSources as { source: string | null; _count: { _all: number } }[]).slice(0, 6).map((s) => (
                <div key={s.source} className="flex items-center justify-between rounded px-2 py-1.5 text-sm odd:bg-muted/30">
                  <span className="truncate font-medium">{s.source}</span>
                  <span className="ml-2 shrink-0 font-mono text-xs text-muted-foreground">{s._count._all}</span>
                </div>
              ))}
              {(topSources as unknown[]).length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">Directo (sin referencias aún)</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Funnel */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-heading text-sm font-medium">Embuido de conversión</h3>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {funnel.map((step, i) => (
            <div key={step.label} className="relative overflow-hidden rounded-lg bg-gradient-to-b from-background to-muted p-4 text-center ring-1 ring-foreground/5">
              <div
                className="absolute bottom-0 left-0 bg-primary/10"
                style={{ height: `${Math.max(step.pct, 2)}%`, width: "100%" }}
              />
              <div className="relative z-10">
                <p className="text-lg font-bold">{typeof step.value === "number" ? step.value.toLocaleString() : step.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{step.label}</p>
                {i < funnel.length - 1 && (
                  <p className="mt-0.5 text-[10px] text-muted-foreground/60">
                    {funnel[i + 1].pct}% → {funnel[i + 1].label}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
        {kpiItems.map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="group relative overflow-hidden rounded-xl bg-gradient-to-br p-4 ring-1 ring-foreground/5">
              <div className={`absolute inset-0 bg-gradient-to-br opacity-80 ${item.color}`} />
              <div className="relative z-10">
                <Icon className="mb-2 size-5 opacity-70" />
                <p className="text-lg font-bold tracking-tight">{typeof item.value === "number" ? item.value.toLocaleString() : item.value}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{item.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts: Daily Visits & Leads */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-medium">Visitas diarias (30 días)</h3>
          </div>
          <div className="flex items-end gap-[3px]" style={{ height: 80 }}>
            {chartVisits.map((d) => (
              <div
                key={d.date}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${Math.max((d.count / maxVisit) * 100, 2)}%`,
                  background: "linear-gradient(to top, #60A5FA, #2563EB)",
                }}
              />
            ))}
          </div>
          <div className="mt-2 text-right text-[10px] text-muted-foreground">
            Total: {chartVisits.reduce((s, d) => s + d.count, 0).toLocaleString()}
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-medium">Leads diarios (30 días)</h3>
          </div>
          <div className="flex items-end gap-[3px]" style={{ height: 80 }}>
            {chartLeads.map((d) => (
              <div
                key={d.date}
                className="flex-1 rounded-sm transition-all"
                style={{
                  height: `${Math.max((d.count / maxLead) * 100, 2)}%`,
                  background: "linear-gradient(to top, #34D399, #059669)",
                }}
              />
            ))}
          </div>
          <div className="mt-2 text-right text-[10px] text-muted-foreground">
            Total: {chartLeads.reduce((s, d) => s + d.count, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Monthly Revenue */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-heading text-sm font-medium">Ingresos mensuales (12 meses)</h3>
        </div>
        <div className="flex items-end gap-1" style={{ height: 100 }}>
          {revenueBars.map((d) => (
            <div key={d.month} className="flex flex-1 flex-col items-center">
              <div
                className="w-full rounded-sm transition-all"
                style={{
                  height: `${Math.max((d.amount / maxRevenue) * 100, 2)}%`,
                  background: "linear-gradient(to top, #A78BFA, #7C3AED)",
                }}
              />
              <span className="mt-1 text-[8px] text-muted-foreground">{d.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Lists */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-medium">Top 10 Búsquedas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">#</th>
                  <th className="pb-2 pr-4">Término</th>
                  <th className="pb-2 text-right">Veces</th>
                </tr>
              </thead>
              <tbody>
                {(topSearches as any[]).map((s: any, i: number) => (
                  <tr key={s.query} className="border-b last:border-0">
                    <td className="py-2 pr-4 text-muted-foreground">{i + 1}</td>
                    <td className="py-2 pr-4 font-medium">{s.query}</td>
                    <td className="py-2 text-right font-mono">{s.count}</td>
                  </tr>
                ))}
                {(topSearches as any[]).length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-medium">Top 10 Categorías buscadas</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Categoría</th>
                  <th className="pb-2 text-right">Búsquedas</th>
                </tr>
              </thead>
              <tbody>
                {(topSearchedCategories as any[]).map((c: any) => (
                  <tr key={c.name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{c.name}</td>
                    <td className="py-2 text-right font-mono">{c.count}</td>
                  </tr>
                ))}
                {(topSearchedCategories as any[]).length === 0 && (
                  <tr><td colSpan={2} className="py-8 text-center text-muted-foreground">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SEO / Tráfico: de dónde vienen y cómo llegan */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-heading text-sm font-medium">Cómo llegan al sitio (30 días)</h3>
        </div>
        {channels.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Aún sin datos de tráfico — se registran conforme entran visitas.
          </p>
        ) : (
          <div className="space-y-2">
            {channels.map((c) => {
              const pct = totalVisitsTracked > 0 ? Math.round((c.count / totalVisitsTracked) * 100) : 0
              return (
                <div key={c.channel} className="flex items-center gap-3">
                  <span className="w-44 shrink-0 text-sm">{c.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(pct, 2)}%` }} />
                  </div>
                  <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                    {c.count} ({pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-medium">Fuentes principales (de dónde vienen)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Fuente</th>
                  <th className="pb-2 text-right">Visitas</th>
                </tr>
              </thead>
              <tbody>
                {(topSources as { source: string | null; _count: { _all: number } }[]).map((s) => (
                  <tr key={s.source} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{s.source}</td>
                    <td className="py-2 text-right font-mono">{s._count._all}</td>
                  </tr>
                ))}
                {(topSources as unknown[]).length === 0 && (
                  <tr><td colSpan={2} className="py-8 text-center text-muted-foreground">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-medium">Páginas de entrada</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Página</th>
                  <th className="pb-2 text-right">Entradas</th>
                </tr>
              </thead>
              <tbody>
                {(topLandings as { path: string; _count: { _all: number } }[]).map((p) => (
                  <tr key={p.path} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{p.path}</td>
                    <td className="py-2 text-right font-mono">{p._count._all}</td>
                  </tr>
                ))}
                {(topLandings as unknown[]).length === 0 && (
                  <tr><td colSpan={2} className="py-8 text-center text-muted-foreground">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Palabras clave reales de Google (Search Console) */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-heading text-sm font-medium">Palabras clave en Google (28 días)</h3>
        </div>
        {googleKeywords === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No conectado. Agrega la cuenta de servicio en Admin → Configuración → SEO para ver las
            palabras clave reales con las que la gente te encuentra en Google.
          </p>
        ) : googleKeywords.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Conectado, pero Google aún no reporta datos (puede tardar días en acumularse).
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Palabra clave</th>
                  <th className="pb-2 pr-4 text-right">Clics</th>
                  <th className="pb-2 pr-4 text-right">Impresiones</th>
                  <th className="pb-2 pr-4 text-right">CTR</th>
                  <th className="pb-2 text-right">Posición</th>
                </tr>
              </thead>
              <tbody>
                {googleKeywords.map((k) => (
                  <tr key={k.keyword} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{k.keyword}</td>
                    <td className="py-2 pr-4 text-right font-mono">{k.clicks}</td>
                    <td className="py-2 pr-4 text-right font-mono">{k.impressions}</td>
                    <td className="py-2 pr-4 text-right font-mono">{(k.ctr * 100).toFixed(1)}%</td>
                    <td className="py-2 text-right font-mono">{k.position.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Google Analytics 4 — tráfico real de Google (credential-ready) */}
      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-heading text-sm font-medium">Google Analytics 4 — tráfico ({ga4?.days ?? 28} días)</h3>
        </div>
        {ga4 === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No conectado. Agrega el <strong>ID de propiedad GA4</strong> en Admin → Configuración → SEO,
            da acceso de Lector a la cuenta de servicio en GA y habilita la Analytics Data API.
          </p>
        ) : !ga4HasData ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Conectado, pero GA4 aún no reporta datos (puede tardar 24-48 h en acumularse tras instalar la etiqueta).
          </p>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {ga4Kpis.map((k) => (
                <div key={k.label} className="rounded-lg bg-muted/40 p-3 text-center ring-1 ring-foreground/5">
                  <p className="flex items-center justify-center gap-1.5 text-lg font-bold tracking-tight">
                    {k.value}
                    {typeof k.trend === "number" && (
                      <span className={`rounded px-1 py-0.5 text-[10px] font-medium ${k.trend >= 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                        {k.trend >= 0 ? "+" : ""}{k.trend}%
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{k.label}</p>
                </div>
              ))}
            </div>
            {/* Desgloses estilo panel: barra clara detrás del texto (sin fondo negro). */}
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {ga4Breakdowns.map((b) => (
                <div key={b.title}>
                  <h4 className="mb-2 text-xs font-medium text-muted-foreground">{b.title}</h4>
                  <div className="space-y-0.5">
                    {b.items.length === 0 ? (
                      <p className="py-3 text-center text-xs text-muted-foreground">Sin datos</p>
                    ) : (
                      b.items.map((it) => (
                        <div key={it.label} className="relative flex items-center justify-between overflow-hidden rounded px-2 py-1.5 text-sm">
                          <div className="absolute inset-y-0 left-0 rounded bg-primary/10" style={{ width: `${Math.max(it.pct, 3)}%` }} />
                          <span className="relative z-10 truncate font-medium">{it.label}</span>
                          <span className="relative z-10 ml-2 shrink-0 text-xs text-muted-foreground">{it.pct}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-medium">Top 10 Colonias (más actividad)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Colonia</th>
                  <th className="pb-2 pr-4">Municipio</th>
                  <th className="pb-2 pr-4 text-right">Vistas</th>
                  <th className="pb-2 text-right">Leads</th>
                </tr>
              </thead>
              <tbody>
                {(topNeighborhoods as any[]).map((n: any) => (
                  <tr key={n.name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{n.name}</td>
                    <td className="py-2 pr-4 text-muted-foreground">{n.municipality}</td>
                    <td className="py-2 pr-4 text-right font-mono">{n.views}</td>
                    <td className="py-2 text-right font-mono">{n.leads}</td>
                  </tr>
                ))}
                {(topNeighborhoods as any[]).length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-heading text-sm font-medium">Top 10 Municipios (más tráfico)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="pb-2 pr-4">Municipio</th>
                  <th className="pb-2 pr-4 text-right">Vistas</th>
                  <th className="pb-2 text-right">Leads</th>
                </tr>
              </thead>
              <tbody>
                {(topMunicipalities as any[]).map((m: any) => (
                  <tr key={m.name} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{m.name}</td>
                    <td className="py-2 pr-4 text-right font-mono">{m.views}</td>
                    <td className="py-2 text-right font-mono">{m.leads}</td>
                  </tr>
                ))}
                {(topMunicipalities as any[]).length === 0 && (
                  <tr><td colSpan={3} className="py-8 text-center text-muted-foreground">Sin datos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
