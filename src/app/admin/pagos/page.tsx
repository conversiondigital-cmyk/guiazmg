import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PagosClient } from "./pagos-client"

export const dynamic = "force-dynamic"

export default async function AdminPagosPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    redirect("/auth/login")
  }

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      business: { select: { id: true, name: true } },
    },
  })

  const [totalRevenue, pendingTotal, refundedTotal] = await Promise.all([
    prisma.payment.aggregate({
      where: { status: "APPROVED" },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { status: "REFUNDED" },
      _sum: { amount: true },
    }),
  ])

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <PagosClient
        payments={JSON.parse(JSON.stringify(payments))}
        stats={{
          totalRevenue: Number(totalRevenue._sum.amount ?? 0),
          pendingTotal: Number(pendingTotal._sum.amount ?? 0),
          refundedTotal: Number(refundedTotal._sum.amount ?? 0),
          total: payments.length,
        }}
      />
    </Suspense>
  )
}
