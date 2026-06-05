export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
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

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-blue-100 text-blue-700",
  CANCELLED: "bg-gray-100 text-gray-700",
}

const STATUS_LABELS: Record<string, string> = {
  COMPLETED: "Completado",
  PENDING: "Pendiente",
  FAILED: "Fallido",
  REFUNDED: "Reembolsado",
  CANCELLED: "Cancelado",
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
      business: { select: { name: true } },
    },
  })

  const totalSpent = payments
    .filter((p) => p.status === "APPROVED")
    .reduce((s, p) => s + Number(p.amount), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pagos</h1>
        <p className="text-gray-500">Historial de transacciones y facturación</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Total transacciones</p>
            <p className="text-2xl font-bold">{payments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Total gastado</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Pagos completados</p>
            <p className="text-2xl font-bold text-green-600">
              {payments.filter((p) => p.status === "APPROVED").length}
            </p>
          </CardContent>
        </Card>
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
                      {p.type}
                      {p.business && (
                        <span className="text-xs text-gray-400 ml-1">({p.business.name})</span>
                      )}
                    </span>
                      {p.business && (
                        <span className="text-xs text-gray-400 ml-1">({p.business.name})</span>
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
