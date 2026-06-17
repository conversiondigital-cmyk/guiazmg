export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Clock, Activity } from "lucide-react"

const ROLE_LABELS: Record<string, string> = {
  USER: "Usuario",
  BUSINESS_OWNER: "Dueño",
  EDITOR: "Editor",
  SALES_AGENT: "Agente",
  ADMIN: "Admin",
}

function fmt(d: Date | null) {
  if (!d) return "—"
  return new Date(d).toLocaleString("es-MX", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  })
}

export default async function AdminActividadUsuariosPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const [users, recentActions, activeToday] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      select: {
        id: true, name: true, email: true, role: true, isActive: true,
        createdAt: true, lastLoginAt: true,
        _count: { select: { businesses: true, reviews: true, marketplaceListings: true } },
      },
      orderBy: [{ lastLoginAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
      take: 200,
    }),
    prisma.auditLog.findMany({
      include: { actor: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.user.count({
      where: { lastLoginAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ])

  const totalUsers = users.length
  const neverLoggedIn = users.filter((u) => !u.lastLoginAt).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Actividad de usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Actividad reciente de todos los usuarios de la plataforma: ingresos, registros y acciones.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Usuarios", value: totalUsers, icon: Activity },
          { label: "Activos (24 h)", value: activeToday, icon: Clock },
          { label: "Nunca ingresaron", value: neverLoggedIn, icon: Clock },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todos los usuarios y su actividad</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead>Último ingreso</TableHead>
                <TableHead className="text-center">Negocios</TableHead>
                <TableHead className="text-center">Reseñas</TableHead>
                <TableHead className="text-center">Publicaciones</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{u.name ?? "Sin nombre"}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>{ROLE_LABELS[u.role] ?? u.role}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmt(u.createdAt)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{fmt(u.lastLoginAt)}</TableCell>
                  <TableCell className="text-center">{u._count.businesses}</TableCell>
                  <TableCell className="text-center">{u._count.reviews}</TableCell>
                  <TableCell className="text-center">{u._count.marketplaceListings}</TableCell>
                  <TableCell>
                    <Badge variant={u.isActive ? "default" : "secondary"}>
                      {u.isActive ? "Activo" : "Suspendido"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Acciones recientes</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {recentActions.length === 0 ? (
            <p className="px-6 py-8 text-center text-sm text-muted-foreground">
              Aún no hay acciones registradas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Entidad</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentActions.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">
                      {a.actor?.name ?? a.actor?.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{a.action}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{a.entityType}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmt(a.createdAt)}</TableCell>
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
