import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { FinancialClient } from "./financial-client"

export const dynamic = "force-dynamic"

export default async function AdminFinancialPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    redirect("/auth/login")
  }

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfYear = new Date(now.getFullYear(), 0, 1)

  const [
    mrrResult,
    monthlyRevenueResult,
    annualRevenueResult,
    boostsSoldResult,
    activeBusinesses,
    renewalsResult,
    cancelledThisMonth,
    activeAtStart,
    monthlyRevenueByType,
    monthlyRevenueLast12,
    recentPayments,
    totalApproved,
  ] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "APPROVED", type: "MEMBERSHIP", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "APPROVED", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "APPROVED", createdAt: { gte: startOfYear } },
      _sum: { amount: true },
    }),
    prisma.boost.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.profile.count({ where: { status: "ACTIVE" } }),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::int as count
      FROM payments
      WHERE status = 'APPROVED' AND type = 'MEMBERSHIP'
        AND "createdAt" >= ${startOfMonth}
        AND (metadata->>'isFirstPayment' IS DISTINCT FROM 'true')
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::int as count
      FROM business_memberships
      WHERE status = 'CANCELLED' AND "updatedAt" >= ${startOfMonth}
    `,
    prisma.profileMembership.count({
      where: { status: "ACTIVE", createdAt: { lt: startOfMonth } },
    }),
    prisma.payment.groupBy({
      by: ["type"],
      where: { status: "APPROVED", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    }),
    prisma.$queryRaw<{ month: string; total: number }[]>`
      SELECT TO_CHAR(date_trunc('month', "createdAt"), 'YYYY-MM') as month,
             SUM(amount)::float as total
      FROM payments
      WHERE status = 'APPROVED'
        AND "createdAt" >= ${new Date(now.getFullYear() - 1, now.getMonth(), 1)}
      GROUP BY date_trunc('month', "createdAt")
      ORDER BY month
    `,
    prisma.payment.findMany({
      where: { status: "APPROVED" },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        user: { select: { id: true, name: true, email: true } },
        profile: { select: { id: true, name: true } },
      },
    }),
    prisma.payment.count({ where: { status: "APPROVED" } }),
  ])

  const mrr = Number(mrrResult._sum.amount ?? 0)
  const arr = mrr * 12
  const monthlyRevenue = Number(monthlyRevenueResult._sum.amount ?? 0)
  const annualRevenue = Number(annualRevenueResult._sum.amount ?? 0)
  const boostsSold = boostsSoldResult
  const activeBiz = activeBusinesses
  const renewals = Number((renewalsResult as any)[0]?.count ?? 0)
  const cancelled = Number((cancelledThisMonth as any)[0]?.count ?? 0)
  const activeStart = activeAtStart
  const churnRate = activeStart > 0 ? (cancelled / activeStart) * 100 : 0
  const arpu = activeBiz > 0 ? monthlyRevenue / activeBiz : 0
  const clv = arpu * 12

  const revenueByType: Record<string, number> = {}
  for (const row of monthlyRevenueByType) {
    revenueByType[row.type] = Number(row._sum.amount ?? 0)
  }

  const months: string[] = []
  for (let i = 11; i >= 0; i--) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1).toISOString().slice(0, 7))
  }

  const chartMap = new Map<string, number>()
  for (const row of monthlyRevenueLast12) {
    chartMap.set(row.month, Number(row.total))
  }
  const chartData = months.map((m) => ({ month: m, revenue: chartMap.get(m) || 0 }))

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <FinancialClient
        mrr={mrr}
        arr={arr}
        monthlyRevenue={monthlyRevenue}
        annualRevenue={annualRevenue}
        boostsSold={boostsSold}
        activeBusinesses={activeBiz}
        renewals={renewals}
        churnRate={Math.round(churnRate * 100) / 100}
        arpu={Math.round(arpu * 100) / 100}
        clv={Math.round(clv * 100) / 100}
        revenueByType={revenueByType}
        chartData={chartData}
        recentPayments={JSON.parse(JSON.stringify(recentPayments))}
        totalApproved={totalApproved}
      />
    </Suspense>
  )
}
