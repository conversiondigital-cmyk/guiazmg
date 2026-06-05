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
import { Package, Plus, Eye, Edit3, Trash2 } from "@/lib/icons"
import { cn } from "@/lib/utils"

const statusLabels: Record<string, string> = {
  ACTIVE: "Activo",
  SOLD: "Vendido",
  RESERVED: "Reservado",
  EXPIRED: "Expirado",
  HIDDEN: "Oculto",
  DELETED: "Eliminado",
}

const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 border-green-200",
  SOLD: "bg-blue-100 text-blue-800 border-blue-200",
  RESERVED: "bg-yellow-100 text-yellow-800 border-yellow-200",
  EXPIRED: "bg-red-100 text-red-800 border-red-200",
  HIDDEN: "bg-gray-100 text-gray-500 border-gray-200",
  DELETED: "bg-red-50 text-red-400 border-red-100",
}

const typeLabels: Record<string, string> = {
  SALE: "Venta",
  PURCHASE: "Compra",
  TRADE: "Intercambio",
  SERVICE: "Servicio",
  REQUEST: "Solicitud",
  EVENT: "Evento",
  PROMOTION: "Promoción",
}

export default async function MisPublicacionesPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const listings = await prisma.marketplaceListing.findMany({
    where: { userId: session.user.id, deletedAt: null },
    include: {
      category: { select: { name: true } },
      municipality: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis publicaciones</h1>
          <p className="text-gray-500">Publicaciones en el marketplace de Guía ZMG</p>
        </div>
        <Link href="/marketplace/nuevo" className={cn(buttonVariants(), "gap-1.5")}>
          <Plus className="h-4 w-4" />
          Nueva publicación
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas mis publicaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {listings.length === 0 ? (
            <div className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                Sin publicaciones
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Publica en el marketplace para vender, intercambiar o anunciar servicios.
              </p>
              <Link
                href="/marketplace/nuevo"
                className={cn(buttonVariants(), "mt-4 gap-1.5")}
              >
                <Plus className="h-4 w-4" />
                Nueva publicación
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Municipio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Vistas</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell className="font-medium">{listing.title}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {typeLabels[listing.type] ?? listing.type}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {listing.category.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {listing.municipality?.name ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={statusColors[listing.status] ?? undefined}
                      >
                        {statusLabels[listing.status] ?? listing.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{listing.views}</TableCell>
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
