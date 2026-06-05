import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatCurrency } from "@/lib/utils"
import { formatDate } from "@/lib/admin-utils"
import {
  Users, Store, ShoppingBag, Megaphone, Star,
  Rocket, CreditCard, MessageCircle, BarChart3, ArrowRight,
} from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

const allowedRoles = ["ADMIN"]

const now = new Date()
const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
const startOfWeek = new Date(now)
startOfWeek.setDate(now.getDate() - 6)
startOfWeek.setHours(0, 0, 0, 0)

interface DailyRow {
  date: Date
  count: number
}

function fillDailyData(rows: DailyRow[], days: number): { date: string; count: number }[] {
  const map = new Map<string, number>()
  for (const r of rows) {
    const key = new Date(r.date).toISOString().slice(0, 10)
    map.set(key, r.count)
  }
  const result: { date: string; count: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    result.push({ date: key, count: map.get(key) || 0 })
  }
  return result
}

const kpiCards = [
  { label: "Usuarios", icon: Users, href: "/admin/usuarios", color: "from-blue-500/20 to-blue-600/10 text-blue-600" },
  { label: "Negocios", icon: Store, href: "/admin/negocios", color: "from-emerald-500/20 to-emerald-600/10 text-emerald-600" },
  { label: "Pendientes", icon: MessageCircle, href: "/admin/negocios", color: "from-amber-500/20 to-amber-600/10 text-amber-600" },
  { label: "Anuncios", icon: Megaphone, href: "/admin/anuncios", color: "from-purple-500/20 to-purple-600/10 text-purple-600" },
  { label: "Marketplace", icon: ShoppingBag, href: "/admin/marketplace", color: "from-pink-500/20 to-pink-600/10 text-pink-600" },
  { label: "Solicitudes", icon: Star, href: "/admin/solicitudes", color: "from-orange-500/20 to-orange-600/10 text-orange-600" },
  { label: "Leads", icon: BarChart3, href: "/admin/analytics", color: "from-cyan-500/20 to-cyan-600/10 text-cyan-600" },
  { label: "Ingresos", icon: CreditCard, href: "/admin/pagos", color: "from-green-500/20 to-green-600/10 text-green-600" },
  { label: "Boosts", icon: Rocket, href: "/admin/boosts", color: "from-red-500/20 to-red-600/10 text-red-600" },
]

export default async function AdminDashboard() {
  const session = await auth()
  if (!session?.user || !allowedRoles.includes(session.user.role ?? "")) {
    redirect("/auth/login")
  }

  const [
    totalUsers,
    totalBusinesses,
    pendingBusinesses,
    activeListings,
    activeMarketplace,
    pendingRequests,
    totalLeads,
    monthlyRevenue,
    activeBoosts,
    dailyUsers,
    dailyBusinesses,
    dailyLeads,
    dailyMarketplace,
    recentUsers,
    recentPayments,
    recentReports,
    recentPendingBusinesses,
  ] = await Promise.all([
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.business.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.business.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.marketplaceListing.count({ where: { status: "ACTIVE", deletedAt: null } }),
    prisma.serviceRequest.count({ where: { status: "ACTIVE" } }),
    prisma.lead.count(),
    prisma.payment.aggregate({
      where: { status: "APPROVED", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.boost.count({ where: { status: "ACTIVE" } }),
    prisma.$queryRaw<DailyRow[]>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM users
      WHERE created_at >= ${startOfWeek} AND deleted_at IS NULL
      GROUP BY DATE(created_at) ORDER BY date
    `,
    prisma.$queryRaw<DailyRow[]>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM businesses
      WHERE created_at >= ${startOfWeek} AND deleted_at IS NULL
      GROUP BY DATE(created_at) ORDER BY date
    `,
    prisma.$queryRaw<DailyRow[]>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM leads
      WHERE created_at >= ${startOfWeek}
      GROUP BY DATE(created_at) ORDER BY date
    `,
    prisma.$queryRaw<DailyRow[]>`
      SELECT DATE(created_at) as date, COUNT(*)::int as count
      FROM marketplace_listings
      WHERE created_at >= ${startOfWeek} AND deleted_at IS NULL
      GROUP BY DATE(created_at) ORDER BY date
    `,
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.payment.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, amount: true, type: true, createdAt: true, user: { select: { name: true } } },
    }),
    prisma.report.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, reason: true, status: true, createdAt: true },
    }),
    prisma.business.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, createdAt: true, owner: { select: { name: true } } },
    }),
  ])

  const revenue = Number(monthlyRevenue._sum.amount ?? 0)

  const chartUsers = fillDailyData(dailyUsers as DailyRow[], 7)
  const chartBusinesses = fillDailyData(dailyBusinesses as DailyRow[], 7)
  const chartLeads = fillDailyData(dailyLeads as DailyRow[], 7)
  const chartMarketplace = fillDailyData(dailyMarketplace as DailyRow[], 7)

  const maxChartVal = Math.max(
    ...chartUsers.map((d) => d.count),
    ...chartBusinesses.map((d) => d.count),
    ...chartLeads.map((d) => d.count),
    ...chartMarketplace.map((d) => d.count),
    1
  )

  const kpis = [
    totalUsers, totalBusinesses, pendingBusinesses, activeListings,
    activeMarketplace, pendingRequests, totalLeads, revenue,
    activeBoosts,
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Panel de Administración</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDate(now)} &middot; {session.user.name || "Admin"}
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:gap-4">
        {kpiCards.map((card, i) => {
          const Icon = card.icon
          const value = kpis[i]
          const displayValue = i === 7 ? formatCurrency(value) : typeof value === "number" ? value.toLocaleString() : "0"
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br p-4 ring-1 ring-foreground/5 transition-all hover:shadow-md"
            >
              <div className={`absolute inset-0 bg-gradient-to-br opacity-80 ${card.color}`} />
              <div className="relative z-10">
                <Icon className="mb-2 size-5 opacity-70" />
                <p className="text-2xl font-bold tracking-tight">{displayValue}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{card.label}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-heading text-sm font-medium">Últimos 7 días — Nuevos registros</h3>
          <div className="space-y-5">
            <MiniChart label="Usuarios" data={chartUsers} max={maxChartVal} index={0} />
            <MiniChart label="Negocios" data={chartBusinesses} max={maxChartVal} index={1} />
            <MiniChart label="Leads" data={chartLeads} max={maxChartVal} index={2} />
            <MiniChart label="Marketplace" data={chartMarketplace} max={maxChartVal} index={3} />
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="mb-4 font-heading text-sm font-medium">Ingresos del mes</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{formatCurrency(revenue)}</span>
            <span className="text-sm text-muted-foreground">MXN</span>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all"
              style={{ width: `${Math.min((revenue / 100000) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Objetivo: {formatCurrency(100000)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-4">
        <ActivityCard
          title="Últimos usuarios"
          href="/admin/usuarios"
          items={recentUsers.map((u) => ({
            label: u.name || u.email || "—",
            meta: u.role,
            date: u.createdAt,
          }))}
        />

        <ActivityCard
          title="Últimos pagos"
          href="/admin/pagos"
          items={recentPayments.map((p) => ({
            label: p.user?.name || "—",
            meta: `${p.type} · ${formatCurrency(Number(p.amount))}`,
            date: p.createdAt,
          }))}
        />

        <ActivityCard
          title="Últimos reportes"
          href="/admin/reportes"
          items={recentReports.map((r) => ({
            label: r.reason || "—",
            meta: r.status,
            date: r.createdAt,
          }))}
        />

        <ActivityCard
          title="Negocios pendientes"
          href="/admin/negocios"
          items={recentPendingBusinesses.map((b) => ({
            label: b.name,
            meta: b.owner?.name || "—",
            date: b.createdAt,
          }))}
        />
      </div>
    </div>
  )
}

const chartGradients = [
  { from: "#60A5FA", to: "#2563EB" },
  { from: "#34D399", to: "#059669" },
  { from: "#22D3EE", to: "#0891B2" },
  { from: "#F472B6", to: "#DB2777" },
]

function MiniChart({
  label,
  data,
  max,
  index,
}: {
  label: string
  data: { date: string; count: number }[]
  max: number
  index: number
}) {
  const g = chartGradients[index % chartGradients.length]
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-muted-foreground">{label}</span>
        <span className="font-semibold">{data.reduce((s, d) => s + d.count, 0)}</span>
      </div>
      <div className="flex items-end gap-[3px]" style={{ height: 40 }}>
        {data.map((d) => (
          <div
            key={d.date}
            className="flex-1 rounded-sm transition-all"
            style={{
              height: `${Math.max((d.count / max) * 100, 4)}%`,
              background: `linear-gradient(to top, ${g.from}, ${g.to})`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

function ActivityCard({
  title,
  href,
  items,
}: {
  title: string
  href: string
  items: { label: string; meta: string; date: Date }[]
}) {
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-heading text-sm font-medium">{title}</h3>
        <Link
          href={href}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Ver todo <ArrowRight className="size-3" />
        </Link>
      </div>
      <div className="space-y-2.5">
        {items.length === 0 && (
          <p className="text-xs text-muted-foreground">Sin datos</p>
        )}
        {items.map((item, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.label}</p>
              <p className="truncate text-xs text-muted-foreground">{item.meta}</p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {item.date.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
