export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { ShoppingBag, Plus, Eye, Edit3, Trash2, Play, Pause } from "@/lib/icons"
import { cn } from "@/lib/utils"

const statusLabels: Record<string, string> = {
  DRAFT: "Borrador",
  PENDING_REVIEW: "Pendiente",
  ACTIVE: "Activo",
  EXPIRED: "Expirado",
  ARCHIVED: "Archivado",
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
  PENDING_REVIEW: "bg-yellow-100 text-yellow-800 border-yellow-200",
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  EXPIRED: "bg-red-100 text-red-800 border-red-200",
  ARCHIVED: "bg-gray-100 text-gray-500 border-gray-200",
}

export default async function ProductosPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const businesses = await prisma.profile.findMany({
    where: { ownerId: session.user.id },
    select: { id: true },
  })

  const businessIds = businesses.map((b) => b.id)

  const listings =
    businessIds.length > 0
      ? await prisma.listing.findMany({
          where: { businessId: { in: businessIds }, deletedAt: null },
          include: {
            category: { select: { name: true } },
            _count: { select: { leads: true, leadEvents: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-500">Gestiona el catálogo de productos de tu perfil</p>
        </div>
        <Link href="/dashboard/productos/nuevo" className={cn(buttonVariants(), "gap-1.5")}>
          <Plus className="h-4 w-4" />
          Agregar producto
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los productos</CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingBag className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Sin productos</h3>
              <p className="mt-2 text-sm text-gray-500">
                Agrega tu primer producto para que aparezca en tu perfil.
              </p>
              <Link
                href="/dashboard/productos/nuevo"
                className={cn(buttonVariants(), "mt-4 gap-1.5")}
              >
                <Plus className="h-4 w-4" />
                Agregar producto
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vistas</TableHead>
                  <TableHead>Leads</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium">{listing.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {listing.category.name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[listing.status] ?? undefined}
                      >
                        {statusLabels[listing.status] ?? listing.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{listing._count.leadEvents}</TableCell>
                    <TableCell>{listing._count.leads}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {listing.createdAt.toLocaleDateString("es-MX")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon-xs" disabled>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" disabled>
                          <Edit3 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" disabled>
                          <Play className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" disabled>
                          <Pause className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-xs" disabled>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
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
