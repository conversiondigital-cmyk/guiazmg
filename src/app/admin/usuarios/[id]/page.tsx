export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import { Users, Calendar, Store, ShoppingBag, CreditCard, Activity, Star, Mail, ChevronRight, UserCheck, UserX } from "@/lib/icons"
import Link from "next/link"
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

const ROLE_LABELS: Record<string, string> = {
  USER: "Usuario",
  BUSINESS_OWNER: "Dueño de Negocio",
  EDITOR: "Editor",
  SALES_AGENT: "Agente de Ventas",
  ADMIN: "Administrador",
}

const BUSINESS_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-700",
  DRAFT: "bg-gray-100 text-gray-700",
  SUSPENDED: "bg-red-100 text-red-700",
  INACTIVE: "bg-gray-100 text-gray-500",
  REJECTED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
}

const PAYMENT_STATUS_COLORS: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-yellow-100 text-yellow-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-blue-100 text-blue-700",
}

function formatCurrency(amount: { toString: () => string } | number | null): string {
  if (amount === null || amount === undefined) return "$0"
  const num = typeof amount === "object" ? Number(amount.toString()) : Number(amount)
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(num)
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          businesses: true,
          reviews: true,
          marketplaceListings: true,
          serviceRequests: true,
          leads: true,
          payments: true,
        },
      },
      businesses: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          slug: true,
          status: true,
          createdAt: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          amount: true,
          status: true,
          type: true,
          createdAt: true,
        },
      },
      auditLogs: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true,
          action: true,
          entityType: true,
          entityId: true,
          oldValue: true,
          newValue: true,
          createdAt: true,
        },
      },
    },
  })

  if (!user) {
    notFound()
  }

  const leadCount = await prisma.lead.count({ where: { userId: id } })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/usuarios"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Usuarios
          </Link>
          <ChevronRight className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-900">{user.name ?? user.email}</span>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900">{user.name ?? "Sin nombre"}</h1>
            {user.isActive ? (
              <Badge className="bg-green-100 text-green-700">
                <UserCheck className="mr-1 h-3 w-3" />
                Activo
              </Badge>
            ) : (
              <Badge variant="destructive">
                <UserX className="mr-1 h-3 w-3" />
                Suspendido
              </Badge>
            )}
          </div>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Negocios</CardTitle>
            <Store className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.businesses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Publicaciones</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.marketplaceListings}</div>
            <p className="text-xs text-gray-500">
              {user._count.serviceRequests} solicitudes de servicio
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pagos</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{user._count.payments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Leads generados</CardTitle>
            <Star className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{leadCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Información
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Nombre</span>
              <span className="text-sm font-medium">{user.name ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm font-medium flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-gray-400" />
                {user.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Rol</span>
              <Badge className={user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : user.role === "EDITOR" ? "bg-blue-100 text-blue-700" : user.role === "SALES_AGENT" ? "bg-orange-100 text-orange-700" : user.role === "BUSINESS_OWNER" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                {ROLE_LABELS[user.role] ?? user.role}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Registro</span>
              <span className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                {user.createdAt.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Último acceso</span>
              <span className="text-sm font-medium">
                {user.lastLoginAt ? user.lastLoginAt.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Nunca"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5 text-blue-600" />
              Negocios
            </CardTitle>
          </CardHeader>
          <CardContent>
            {user.businesses.length === 0 ? (
              <p className="text-sm text-gray-500">Sin negocios registrados</p>
            ) : (
              <div className="space-y-2">
                {user.businesses.map((biz) => (
                  <div key={biz.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <Link href={`/perfil/${biz.slug}`} className="text-sm font-medium text-blue-600 hover:underline">
                        {biz.name}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {biz.createdAt.toLocaleDateString("es-MX")}
                      </p>
                    </div>
                    <Badge className={BUSINESS_STATUS_COLORS[biz.status] ?? "bg-gray-100 text-gray-700"}>
                      {biz.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-blue-600" />
            Pagos Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {user.payments.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">Sin pagos registrados</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">{payment.type}</TableCell>
                    <TableCell>{formatCurrency(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge className={PAYMENT_STATUS_COLORS[payment.status] ?? "bg-gray-100 text-gray-700"}>
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {payment.createdAt.toLocaleDateString("es-MX")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Actividad Reciente
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {user.auditLogs.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">Sin actividad registrada</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Detalle</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {user.auditLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.action.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-sm text-gray-500">{log.entityType}</TableCell>
                    <TableCell className="text-xs text-gray-500 max-w-[200px] truncate">
                      {log.newValue ?? log.oldValue ?? "-"}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {log.createdAt.toLocaleDateString("es-MX", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
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
