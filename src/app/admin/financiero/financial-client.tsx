"use client"

import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Rocket,
  Store,
  Users,
  BarChart3,
  Repeat,
  TrendingDown,
} from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

type RecentPayment = {
  id: string
  user: { id: string; name: string | null; email: string }
  business: { id: string; name: string } | null
  provider: string
  type: string
  amount: number
  status: string
  createdAt: string
}

type Props = {
  mrr: number
  arr: number
  monthlyRevenue: number
  annualRevenue: number
  boostsSold: number
  activeBusinesses: number
  renewals: number
  churnRate: number
  arpu: number
  clv: number
  revenueByType: Record<string, number>
  chartData: { month: string; revenue: number }[]
  recentPayments: RecentPayment[]
  totalApproved: number
}

const statusLabels: Record<string, string> = {
  APPROVED: "Aprobado",
  PENDING: "Pendiente",
  REJECTED: "Rechazado",
  REFUNDED: "Reembolsado",
  CANCELLED: "Cancelado",
  AUTHORIZED: "Autorizado",
}

const statusVariant: Record<string, string> = {
  APPROVED: "default",
  PENDING: "outline",
  REJECTED: "destructive",
  REFUNDED: "secondary",
  CANCELLED: "destructive",
  AUTHORIZED: "outline",
}

const typeLabels: Record<string, string> = {
  MEMBERSHIP: "Membresía",
  BOOST: "Boost",
  LISTING: "Listing",
}

const typeColors: Record<string, string> = {
  MEMBERSHIP: "#3B82F6",
  BOOST: "#8B5CF6",
  LISTING: "#10B981",
}

export function FinancialClient(props: Props) {
  const {
    mrr,
    arr,
    monthlyRevenue,
    annualRevenue,
    boostsSold,
    activeBusinesses,
    renewals,
    churnRate,
    arpu,
    clv,
    revenueByType,
    chartData,
    recentPayments,
  } = props

  const maxChartRevenue = Math.max(...chartData.map((d) => d.revenue), 1)

  const totalByType = Object.values(revenueByType).reduce((s, v) => s + v, 0) || 1
  let conicStr = ""
  let angle = 0
  const typeEntries = Object.entries(revenueByType).filter(([, v]) => v > 0)
  for (const [type, amount] of typeEntries) {
    const pct = (amount / totalByType) * 360
    const nextAngle = angle + pct
    conicStr += `${typeColors[type] || "#6B7280"} ${angle}deg ${nextAngle}deg${typeEntries.length > 1 ? "," : ""}`
    angle = nextAngle
  }
  if (!conicStr) conicStr = "#E5E7EB 0deg 360deg"

  const kpiCards = [
    { label: "MRR", value: formatCurrency(mrr), icon: DollarSign, color: "text-blue-600", sub: "Ingresos mensuales recurrentes" },
    { label: "ARR", value: formatCurrency(arr), icon: TrendingUp, color: "text-indigo-600", sub: "MRR × 12" },
    { label: "Ingresos del mes", value: formatCurrency(monthlyRevenue), icon: CreditCard, color: "text-green-600", sub: "Todos los tipos" },
    { label: "Ingresos anuales", value: formatCurrency(annualRevenue), icon: BarChart3, color: "text-emerald-600", sub: "Este año" },
      { label: "Boosts creados", value: boostsSold.toLocaleString(), icon: Rocket, color: "text-purple-600", sub: "Este mes" },
    { label: "Negocios activos", value: activeBusinesses.toLocaleString(), icon: Store, color: "text-cyan-600", sub: "Status ACTIVE" },
    { label: "Renovaciones", value: renewals.toLocaleString(), icon: Repeat, color: "text-orange-600", sub: "Membresías no-primeras" },
    { label: "Churn Rate", value: `${churnRate}%`, icon: TrendingDown, color: churnRate > 5 ? "text-red-600" : "text-green-600", sub: "Cancelaciones este mes" },
    { label: "ARPU", value: formatCurrency(arpu), icon: Users, color: "text-sky-600", sub: "Ingreso mensual / negocios activos" },
    { label: "CLV", value: formatCurrency(clv), icon: DollarSign, color: "text-violet-600", sub: "ARPU × 12 meses" },
  ]

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Financiero</h1>
          <p className="mt-1 text-sm text-muted-foreground">Panel de indicadores financieros</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 xl:gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
                <Icon className={`size-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-xl font-bold ${card.color}`}>{card.value}</div>
                <p className="mt-0.5 text-[10px] text-muted-foreground">{card.sub}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Ingresos mensuales (últimos 12 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-1.5" style={{ height: 180 }}>
              {chartData.map((d) => {
                const pct = Math.max((d.revenue / maxChartRevenue) * 100, 2)
                return (
                  <div key={d.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {formatCurrency(d.revenue)}
                    </span>
                    <div
                      className="w-full rounded-sm bg-gradient-to-t from-blue-500 to-blue-400 transition-all"
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {d.month.slice(5)}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Desglose por tipo</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-6">
            <div
              className="size-36 shrink-0 rounded-full"
              style={{ background: `conic-gradient(${conicStr})` }}
            />
            <div className="space-y-2">
              {typeEntries.map(([type, amount]) => (
                <div key={type} className="flex items-center gap-2 text-sm">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: typeColors[type] || "#6B7280" }}
                  />
                  <span className="w-20 text-muted-foreground">{typeLabels[type] || type}</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
              {typeEntries.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin ingresos este mes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Transacciones recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Usuario</th>
                  <th className="px-4 py-3 font-medium">Negocio</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Monto</th>
                  <th className="px-4 py-3 font-medium">Proveedor</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                      No hay transacciones
                    </td>
                  </tr>
                ) : (
                  recentPayments.map((p) => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <span className="font-medium">{p.user?.name || "—"}</span>
                        <span className="ml-1.5 text-xs text-muted-foreground">{p.user?.email}</span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {p.business?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {typeLabels[p.type] && (
                            <div
                              className="size-2.5 rounded-full"
                              style={{ backgroundColor: typeColors[p.type] }}
                            />
                          )}
                          {typeLabels[p.type] || p.type}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium">{formatCurrency(Number(p.amount))}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {p.provider === "MERCADO_PAGO" ? "Mercado Pago" : p.provider}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={(statusVariant[p.status] || "outline") as any}>
                          {statusLabels[p.status] || p.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(p.createdAt).toLocaleDateString("es-MX", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
