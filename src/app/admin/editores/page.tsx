import { notFound, redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail, Calendar } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminEditoresPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  // Get all editors
  const editors = await prisma.user.findMany({
    where: { role: "EDITOR" },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true,
    },
    orderBy: { createdAt: "desc" },
  })

  // Get stats
  const [totalEditors, activeEditors] = await Promise.all([
    prisma.user.count({ where: { role: "EDITOR" } }),
    prisma.user.count({ where: { role: "EDITOR", isActive: true } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">Editores</h1>
        <p className="text-sm text-slate-500">Gestión de usuarios con rol Editor</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-950">{totalEditors}</div>
              <p className="text-sm text-slate-500 mt-1">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-950">{activeEditors}</div>
              <p className="text-sm text-slate-500 mt-1">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-950">{totalEditors - activeEditors}</div>
              <p className="text-sm text-slate-500 mt-1">Inactivos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado ({editors.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {editors.length === 0 ? (
            <p className="text-sm text-slate-500">No hay editores registrados</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Registro</TableHead>
                    <TableHead>Último acceso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editors.map((editor) => (
                    <TableRow key={editor.id}>
                      <TableCell className="font-medium">{editor.name || "—"}</TableCell>
                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="size-3.5" />
                          {editor.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={editor.isActive ? "default" : "secondary"}>
                          {editor.isActive ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="size-3.5" />
                          {new Date(editor.createdAt).toLocaleDateString("es-MX")}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {editor.lastLoginAt
                          ? new Date(editor.lastLoginAt).toLocaleString("es-MX")
                          : "Nunca"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
