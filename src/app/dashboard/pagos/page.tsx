export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { formatCurrency } from "@/lib/utils"
import { BillingPortalButton } from "@/components/dashboard/billing-portal-button"

// Estados reales del enum PaymentStatus (APPROVED es el de un pago exitoso).
const STATUS_COLORS: Record<string, string> = {
  APPROVED: "bg-green-100 text-green-700",
  AUTHORIZED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  REJECTED: "bg-red-100 text-red-700",
  REFUNDED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-gray-100 text-gray-700",
}

const STATUS_LABELS: Record<string, string> = {
  APPROVED: "Completado",
  AUTHORIZED: "Autorizado",
  PENDING: "Pendiente",
  REJECTED: "Rechazado",
  REFUNDED: "Reembolsado",
  CANCELLED: "Cancelado",
}

// Concepto legible por tipo de pago (en vez del valor crudo del enum).
const TYPE_LABELS: Record<string, string> = {
  MEMBERSHIP: "Membresía",
  BOOST: "Boost",
  LISTING: "Publicación",
}

export default async function PagosPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const payments = await prisma.payment.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      status: true,
      amount: true,
      provider: true,
      type: true,
      profile: { select: { name: true } },
    },
  })

  const totalSpent = payments
    .filter((p) => p.status === "APPROVED")
    .reduce((s, p) => s + Number(p.amount), 0)

  // ¿El usuario tiene una suscripción de pago (cliente de Stripe)? Solo entonces
  // tiene sentido el botón del portal (ahí ve/descarga sus facturas en PDF).
  const business = await prisma.profile.findFirst({
    where: { ownerId: session.user.id, deletedAt: null },
    select: { id: true },
  })
  const membership = business
    ? await prisma.profileMembership.findUnique({
        where: { businessId: business.id },
        select: { providerCustomerId: true },
      })
    : null
  const hasStripeBilling = !!membership?.providerCustomerId

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
          <p className="text-gray-500">Historial de transacciones y facturación</p>
        </div>
        {hasStripeBilling && (
          <div className="text-right">
            <BillingPortalButton label="Ver recibos y facturas" />
            <p className="mt-1 text-xs text-gray-400">Descarga tus recibos en PDF desde Stripe.</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/pagos" className="block">
          <Card className="h-full transition-shadow hover:border-green-200 hover:shadow-md">
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">Total transacciones</p>
              <p className="text-2xl font-bold">{payments.length}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/pagos" className="block">
          <Card className="h-full transition-shadow hover:border-green-200 hover:shadow-md">
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">Total gastado</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(totalSpent)}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/pagos" className="block">
          <Card className="h-full transition-shadow hover:border-green-200 hover:shadow-md">
            <CardContent className="p-5">
              <p className="text-sm text-gray-500">Pagos completados</p>
              <p className="text-2xl font-bold text-green-600">
                {payments.filter((p) => p.status === "APPROVED").length}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historial de pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay pagos registrados</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {p.createdAt.toLocaleDateString("es-MX", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-900">
                        {TYPE_LABELS[p.type] || p.type}
                      </span>
                      {p.profile && (
                        <span className="ml-1 text-xs text-gray-400">({p.profile.name})</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{formatCurrency(Number(p.amount))}</TableCell>
                    <TableCell className="text-sm text-gray-500">{p.provider}</TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[p.status] || ""}>
                        {STATUS_LABELS[p.status] || p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
