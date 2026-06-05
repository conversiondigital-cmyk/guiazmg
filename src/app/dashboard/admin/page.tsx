export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Store, Clock, CreditCard, TrendingUp } from "@/lib/icons"
import Link from "next/link"

export default async function AdminDashboardPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/admin")
  }

  const [
    totalUsers,
    totalBusinesses,
    pendingBusinesses,
    activeMemberships,
    totalPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.business.count(),
    prisma.business.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.businessMembership.count({ where: { status: "ACTIVE" } }),
    prisma.payment.aggregate({
      _sum: { amount: true },
      where: { status: "APPROVED" },
    }),
  ])

  const recentBusinesses = await prisma.business.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { name: true, email: true } }, municipality: true },
  })

  const stats = [
    { label: "Usuarios", value: totalUsers, icon: Users },
    { label: "Negocios", value: totalBusinesses, icon: Store },
    { label: "Pendientes", value: pendingBusinesses, icon: Clock },
    { label: "Membresías", value: activeMemberships, icon: CreditCard },
    {
      label: "Ingresos",
      value: `$${Number(totalPayments._sum.amount || 0).toLocaleString("es-MX")}`,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
          <p className="text-gray-500">Alias legacy, redirigido al panel maestro</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">{stat.label}</CardTitle>
              <stat.icon className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Negocios Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-3 font-medium text-gray-500">Negocio</th>
                  <th className="pb-3 font-medium text-gray-500">Dueño</th>
                  <th className="pb-3 font-medium text-gray-500">Municipio</th>
                  <th className="pb-3 font-medium text-gray-500">Estado</th>
                  <th className="pb-3 font-medium text-gray-500">Fecha</th>
                  <th className="pb-3 font-medium text-gray-500">Acción</th>
                </tr>
              </thead>
              <tbody>
                {recentBusinesses.map((business) => (
                  <tr key={business.id} className="border-b last:border-0">
                    <td className="py-3 font-medium">{business.name}</td>
                    <td className="py-3 text-gray-500">{business.owner?.name || business.owner?.email}</td>
                    <td className="py-3 text-gray-500">{business.municipality?.name || "-"}</td>
                    <td className="py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          business.status === "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : business.status === "PENDING_REVIEW"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {business.status}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500">
                      {business.createdAt.toLocaleDateString("es-MX")}
                    </td>
                    <td className="py-3">
                      <Link
                        href={`/perfil/${business.slug}`}
                        className="inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 py-1 text-sm font-medium hover:bg-muted transition-colors"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
