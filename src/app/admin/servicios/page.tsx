import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { Wrench } from "lucide-react"

export const dynamic = "force-dynamic"

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING_REVIEW: "Pendiente",
  ACTIVE: "Activo",
  EXPIRED: "Expirado",
  ARCHIVED: "Archivado",
}
const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800",
  ACTIVE: "bg-green-100 text-green-800",
  EXPIRED: "bg-red-100 text-red-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
}

export default async function AdminServiciosPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role ?? "")) {
    redirect("/auth/login")
  }

  const listings = await prisma.listing.findMany({
    where: {
      deletedAt: null,
      category: { slug: { contains: "servicio" } },
    },
    include: {
      profile: { select: { id: true, name: true, slug: true } },
      category: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const stats = {
    total: await prisma.listing.count({ where: { deletedAt: null, category: { slug: { contains: "servicio" } } } }),
    active: await prisma.listing.count({ where: { deletedAt: null, status: "ACTIVE", category: { slug: { contains: "servicio" } } } }),
    pending: await prisma.listing.count({ where: { deletedAt: null, status: "PENDING_REVIEW", category: { slug: { contains: "servicio" } } } }),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Servicios</h1>
        <p className="text-sm text-muted-foreground">
          Servicios publicados por perfiles comerciales en la plataforma
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Activos", value: stats.active },
          { label: "Pendientes", value: stats.pending },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todos los servicios</CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="py-12 text-center">
              <Wrench className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No hay servicios registrados aún</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Servicio</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-medium">{l.title}</TableCell>
                    <TableCell className="text-muted-foreground">{l.profile.name}</TableCell>
                    <TableCell className="text-muted-foreground">{l.category.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={statusColors[l.status]}>
                        {statusLabels[l.status] ?? l.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {l.createdAt.toLocaleDateString("es-MX")}
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
