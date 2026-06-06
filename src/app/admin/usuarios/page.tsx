export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Users, Shield, Eye, Edit3, MoreHorizontal, Search, UserCheck, UserX } from "@/lib/icons"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// no select controls on this screen
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const ROLE_LABELS: Record<string, string> = {
  ALL: "Todos",
  USER: "Usuarios",
  BUSINESS_OWNER: "Dueños",
  EDITOR: "Editores",
  SALES_AGENT: "Agentes",
  ADMIN: "Administradores",
}

function getRoleColor(role: string): string {
  switch (role) {
    case "ADMIN": return "bg-purple-100 text-purple-700"
    case "EDITOR": return "bg-blue-100 text-blue-700"
    case "SALES_AGENT": return "bg-orange-100 text-orange-700"
    case "BUSINESS_OWNER": return "bg-green-100 text-green-700"
    default: return "bg-gray-100 text-gray-700"
  }
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ rol?: string; status?: string; q?: string; page?: string }>
}) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      redirect("/dashboard")
    }

    const params = await searchParams
    const currentRol = params.rol ?? "ALL"
    const currentStatus = params.status ?? "active"
    const currentQ = params.q ?? ""
    const currentPage = Math.max(1, parseInt(params.page ?? "1", 10))
    const limit = 20

    const where: Record<string, unknown> = { deletedAt: null }

    if (currentRol !== "ALL") {
      where.role = currentRol
    }

    if (currentStatus === "suspended") {
      where.isActive = false
    } else if (currentStatus !== "all") {
      where.isActive = true
    }

    if (currentQ) {
      where.OR = [
        { name: { contains: currentQ, mode: "insensitive" } },
        { email: { contains: currentQ, mode: "insensitive" } },
      ]
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
          image: true,
          _count: {
            select: {
              businesses: true,
              reviews: true,
              marketplaceListings: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (currentPage - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

  const totalPages = Math.ceil(total / limit)

  function buildUrl(overrides: Record<string, string | undefined>) {
    const sp = new URLSearchParams()
    const rol = overrides.rol !== undefined ? overrides.rol : currentRol
    const status = overrides.status !== undefined ? overrides.status : currentStatus
    const q = overrides.q !== undefined ? overrides.q : currentQ
    const page = overrides.page !== undefined ? overrides.page : "1"
    if (rol && rol !== "ALL") sp.set("rol", rol)
    if (status && status !== "active") sp.set("status", status)
    if (q) sp.set("q", q)
    if (page !== "1") sp.set("page", page)
    const qs = sp.toString()
    return `/admin/usuarios${qs ? `?${qs}` : ""}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500">Gestiona los usuarios de la plataforma</p>
        </div>
        <Users className="h-8 w-8 text-blue-600" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(["ALL", "USER", "BUSINESS_OWNER", "EDITOR", "SALES_AGENT", "ADMIN"] as const).map((r) => (
          <Link
            key={r}
            href={buildUrl({ rol: r === "ALL" ? "" : r })}
            className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              currentRol === r
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {ROLE_LABELS[r]}
          </Link>
        ))}
        <Link
          href={buildUrl({ status: "suspended" })}
          className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            currentStatus === "suspended"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          <UserX className="mr-1 h-3.5 w-3.5" />
          Suspendidos
        </Link>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <form action={buildUrl({ q: undefined, page: "1" })} method="GET">
            <Input
              name="q"
              placeholder="Buscar por nombre o email..."
              defaultValue={currentQ}
              className="pl-8"
            />
          </form>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre / Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Negocios</TableHead>
                <TableHead className="text-center">Reseñas</TableHead>
                <TableHead className="text-center">Publicaciones</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-700">
                          {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name ?? "Sin nombre"}</div>
                          <div className="text-xs text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {ROLE_LABELS[user.role] ?? user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.isActive ? (
                        <Badge variant="outline" className="border-green-300 text-green-700 bg-green-50">
                          <UserCheck className="mr-1 h-3 w-3" />
                          Activo
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <UserX className="mr-1 h-3 w-3" />
                          Suspendido
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">{user._count.businesses}</TableCell>
                    <TableCell className="text-center">{user._count.reviews}</TableCell>
                    <TableCell className="text-center">{user._count.marketplaceListings}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {user.createdAt.toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" />}>
                          <MoreHorizontal className="h-4 w-4" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            render={<Link href={`/admin/usuarios/${user.id}`} />}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Ver
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit3 className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          {user.isActive ? (
                            <DropdownMenuItem variant="destructive">
                              <UserX className="mr-2 h-4 w-4" />
                              Suspender
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem>
                              <UserCheck className="mr-2 h-4 w-4" />
                              Reactivar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem>
                            <Shield className="mr-2 h-4 w-4" />
                            Cambiar Rol
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            Página {currentPage} de {totalPages} ({total} usuarios)
          </span>
          <div className="flex gap-1">
            {currentPage > 1 && (
              <Link
                href={buildUrl({ page: String(currentPage - 1) })}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
              >
                Anterior
              </Link>
            )}
            {currentPage < totalPages && (
              <Link
                href={buildUrl({ page: String(currentPage + 1) })}
                className="rounded-lg border px-3 py-1.5 hover:bg-gray-50"
              >
                Siguiente
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  ) } catch (error) {
    console.error("[ADMIN_USUARIOS_ERROR]", error)
    throw error
  }
}
