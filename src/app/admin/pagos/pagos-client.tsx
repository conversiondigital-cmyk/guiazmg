"use client"

import { useCallback, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CreditCard,
  DollarSign,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  RotateCcw,
  TrendingUp,
  Rocket,
  ShoppingBag,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatCurrency, timeAgo } from "@/lib/utils"

type PaymentUser = { id: string; name: string | null; email: string }
type PaymentBusiness = { id: string; name: string }

type Payment = {
  id: string
  user: PaymentUser
  business: PaymentBusiness | null
  provider: string
  providerPaymentId: string | null
  type: string
  amount: number
  currency: string
  status: "PENDING" | "APPROVED" | "FAILED" | "REFUNDED"
  metadata: any
  createdAt: string
}

type Stats = {
  totalRevenue: number
  pendingTotal: number
  refundedTotal: number
  total: number
}

const statusBadge = (status: string) => {
  const variants: Record<string, string> = {
    PENDING: "outline",
    APPROVED: "default",
    FAILED: "destructive",
    REFUNDED: "secondary",
  }
  const labels: Record<string, string> = {
    PENDING: "Pendiente",
    APPROVED: "Pagado",
    FAILED: "Cancelado",
    REFUNDED: "Reembolsado",
  }
  return <Badge variant={(variants[status] || "ghost") as any}>{labels[status] || status}</Badge>
}

const typeIcon: Record<string, any> = {
  MEMBERSHIP: CreditCard,
  BOOST: Rocket,
  LISTING: ShoppingBag,
}

const typeLabels: Record<string, string> = {
  MEMBERSHIP: "Membresía",
  BOOST: "Boost",
  LISTING: "Listing",
}

export function PagosClient({
  payments,
  stats,
}: {
  payments: Payment[]
  stats: Stats
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [confirmDialog, setConfirmDialog] = useState<{
    payment: Payment
    action: string
  } | null>(null)

  const filter = searchParams.get("status") || "ALL"

  const createQueryString = useCallback(
    (params: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === "") {
          newParams.delete(key)
        } else {
          newParams.set(key, value)
        }
      }
      return newParams.toString()
    },
    [searchParams]
  )

  const setFilter = (value: string) => {
    const qs = createQueryString({ status: value === "ALL" ? undefined : value })
    router.push(`/admin/pagos?${qs}`)
  }

  const filteredPayments =
    filter === "ALL" ? payments : payments.filter((p) => p.status === filter)

  const counts = {
    ALL: payments.length,
    PENDING: payments.filter((p) => p.status === "PENDING").length,
    APPROVED: payments.filter((p) => p.status === "APPROVED").length,
    FAILED: payments.filter((p) => p.status === "FAILED").length,
    REFUNDED: payments.filter((p) => p.status === "REFUNDED").length,
  }

  const handleAction = async () => {
    if (!confirmDialog) return
    try {
      const res = await fetch("/api/admin/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: confirmDialog.payment.id,
          action: confirmDialog.action,
        }),
      })
      if (!res.ok) throw new Error("Error")
      setConfirmDialog(null)
      router.refresh()
    } catch (err) {
      console.error(err)
    }
  }

  const actionLabels: Record<string, string> = {
    approve: "aprobar",
    cancel: "cancelar",
    refund: "reembolsar",
  }

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Pagos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona los pagos recibidos</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total ingresos</CardTitle>
            <DollarSign className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <TrendingUp className="size-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatCurrency(stats.pendingTotal)}
            </div>
            <p className="text-xs text-muted-foreground">{counts.PENDING} transacciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reembolsados</CardTitle>
            <RotateCcw className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(stats.refundedTotal)}
            </div>
            <p className="text-xs text-muted-foreground">{counts.REFUNDED} transacciones</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={filter} onValueChange={setFilter}>
        <TabsList>
          <TabsTrigger value="ALL">Todos ({counts.ALL})</TabsTrigger>
          <TabsTrigger value="PENDING">Pendientes ({counts.PENDING})</TabsTrigger>
          <TabsTrigger value="APPROVED">Pagados ({counts.APPROVED})</TabsTrigger>
          <TabsTrigger value="FAILED">Cancelados ({counts.FAILED})</TabsTrigger>
          <TabsTrigger value="REFUNDED">Reembolsados ({counts.REFUNDED})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Negocio</TableHead>
              <TableHead>Método</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-[50px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No se encontraron pagos
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => {
                const TypeIcon = typeIcon[payment.type] || CreditCard
                return (
                  <TableRow key={payment.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {payment.user.name || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {payment.user.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {payment.business ? (
                        <span className="text-sm">{payment.business.name}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {payment.provider === "MERCADO_PAGO" ? "Mercado Pago" : payment.provider}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <TypeIcon className="size-3.5 text-muted-foreground" />
                        <span className="text-sm">{typeLabels[payment.type] || payment.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(Number(payment.amount))}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {timeAgo(new Date(payment.createdAt))}
                    </TableCell>
                    <TableCell>{statusBadge(payment.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-xs">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {payment.status === "PENDING" && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  setConfirmDialog({ payment, action: "approve" })
                                }
                              >
                                <CheckCircle className="size-4 text-green-500" />
                                Aprobar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() =>
                                  setConfirmDialog({ payment, action: "cancel" })
                                }
                              >
                                <XCircle className="size-4" />
                                Cancelar
                              </DropdownMenuItem>
                            </>
                          )}
                          {payment.status === "APPROVED" && (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmDialog({ payment, action: "refund" })
                              }
                            >
                              <RotateCcw className="size-4" />
                              Reembolsar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={!!confirmDialog}
        onOpenChange={(open) => !open && setConfirmDialog(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar acción</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmDialog && (
              <>
                ¿Estás seguro de {actionLabels[confirmDialog.action]} el pago de{" "}
                <strong>
                  {formatCurrency(Number(confirmDialog.payment.amount))}
                </strong>{" "}
                de {confirmDialog.payment.user.name || "—"}?
              </>
            )}
          </p>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button
              variant={
                confirmDialog?.action === "cancel" ||
                confirmDialog?.action === "refund"
                  ? "destructive"
                  : "default"
              }
              onClick={handleAction}
            >
              {confirmDialog &&
                actionLabels[confirmDialog.action]?.charAt(0).toUpperCase() +
                  actionLabels[confirmDialog.action]?.slice(1)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
