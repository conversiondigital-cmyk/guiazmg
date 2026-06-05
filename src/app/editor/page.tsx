import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { formatDate } from "@/lib/admin-utils"
import { ShoppingBag, Flag, Star, ArrowRight, Store } from "lucide-react"
import Link from "next/link"

export const dynamic = "force-dynamic"

export default async function EditorDashboard() {
  const session = await auth()
  if (!session?.user || session.user.role !== "EDITOR") {
    redirect("/auth/login")
  }

  const [
    pendingBusinesses,
    pendingMarketplace,
    openReports,
    pendingReviews,
    recentPendingBusinesses,
    recentReports,
  ] = await Promise.all([
    prisma.business.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.marketplaceListing.count({ where: { status: "ACTIVE", deletedAt: null, type: "PROMOTION" as any } }),
    prisma.report.count({ where: { status: "PENDING" } }),
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.business.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, name: true, slug: true, createdAt: true, owner: { select: { name: true } } },
    }),
    prisma.report.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, reason: true, createdAt: true, business: { select: { name: true } } },
    }),
    prisma.marketplaceListing.findMany({
      where: { status: "ACTIVE", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, createdAt: true },
    }),
  ])

  const kpis = [
    { label: "Negocios pendientes", value: pendingBusinesses, icon: Store, href: "/editor/negocios", color: "from-amber-500/20 to-amber-600/10 text-amber-600" },
    { label: "Marketplace pendientes", value: pendingMarketplace, icon: ShoppingBag, href: "/editor/marketplace", color: "from-pink-500/20 to-pink-600/10 text-pink-600" },
    { label: "Reportes abiertos", value: openReports, icon: Flag, href: "/editor/reportes", color: "from-red-500/20 to-red-600/10 text-red-600" },
    { label: "Reseñas pendientes", value: pendingReviews, icon: Star, href: "/editor/reviews", color: "from-purple-500/20 to-purple-600/10 text-purple-600" },
  ]

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Dashboard del Editor</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatDate(new Date())} &middot; {session.user.name || "Editor"}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Link
              key={kpi.label}
              href={kpi.href}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-br p-4 ring-1 ring-foreground/5 transition-all hover:shadow-md"
            >
              <div className={`absolute inset-0 bg-gradient-to-br opacity-80 ${kpi.color}`} />
              <div className="relative z-10">
                <Icon className="mb-2 size-5 opacity-70" />
                <p className="text-2xl font-bold tracking-tight">{kpi.value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{kpi.label}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-sm font-medium">Negocios pendientes de revisión</h3>
            <Link
              href="/editor/negocios"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Ver todo <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentPendingBusinesses.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin pendientes</p>
            )}
            {recentPendingBusinesses.map((b) => (
              <div key={b.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{b.owner?.name || "—"}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {b.createdAt.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-heading text-sm font-medium">Reportes abiertos</h3>
            <Link
              href="/editor/reportes"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              Ver todo <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="space-y-2.5">
            {recentReports.length === 0 && (
              <p className="text-xs text-muted-foreground">Sin reportes</p>
            )}
            {recentReports.map((r) => (
              <div key={r.id} className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.reason}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.business?.name || "—"}</p>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {r.createdAt.toLocaleDateString("es-MX", { day: "numeric", month: "short" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
