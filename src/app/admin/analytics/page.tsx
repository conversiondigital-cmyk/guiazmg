import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  Users, Store, ShoppingBag, Search,
  MapPin, Eye, DollarSign, Target, Activity, Zap, Tag, BarChart3,
} from "@/lib/icons"

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
    approvedPayments,
    totalSearches,
    totalViews,
    dailyVisitRows,
    dailyLeadRows,
    monthlyRevenueRows,
    topSearches,
    topSearchedCategories,
    topNeighborhoods,
    topMunicipalities,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.profile.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.marketplaceListing.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.lead.count(),
    prisma.payment.findMany({ where: { status: "APPROVED" }, select: { amount: true } }),
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
  ])

  const monthlyRevenue = approvedPayments.reduce((sum, p) => sum + Number(p.amount), 0)
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
