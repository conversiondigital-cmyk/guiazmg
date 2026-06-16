export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table"
import { Zap, Clock, Calendar, Plus } from "@/lib/icons"

function resolveStatus(boost: { status: string; startsAt: Date }) {
  if (boost.status === "CANCELLED")
    return { label: "Cancelado", color: "bg-gray-100 text-gray-700", key: "CANCELLED" }
  if (boost.status === "EXPIRED")
    return { label: "Vencido", color: "bg-red-100 text-red-700", key: "EXPIRED" }
  if (boost.startsAt > new Date())
    return { label: "Programado", color: "bg-yellow-100 text-yellow-700", key: "SCHEDULED" }
  return { label: "Activo", color: "bg-green-100 text-green-700", key: "ACTIVE" }
}

export default async function BoostsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const businesses = await prisma.profile.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  })
  const businessIds = businesses.map((b) => b.id)

  const boosts =
    businessIds.length > 0
      ? await prisma.boost.findMany({
          where: { businessId: { in: businessIds } },
          include: {
            profile: { select: { name: true } },
            listing: { select: { title: true } },
          },
          orderBy: { createdAt: "desc" },
        })
      : []

  const enriched = boosts.map((b) => ({ ...b, _status: resolveStatus(b) }))
  const active = enriched.filter((b) => b._status.key === "ACTIVE")
  const scheduled = enriched.filter((b) => b._status.key === "SCHEDULED")
  const other = enriched.filter((b) => b._status.key !== "ACTIVE" && b._status.key !== "SCHEDULED")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Boosts</h1>
          <p className="text-gray-500">Impulsa tus anuncios para llegar a más clientes</p>
        </div>
        <Button render={<Link href="/dashboard/boosts/nuevo" />}>
          <Plus className="mr-2 h-4 w-4" />
          Crear Boost
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/boosts" className="block">
          <Card className="h-full transition-shadow hover:border-green-200 hover:shadow-md">
            <CardContent className="p-5">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Zap className="h-4 w-4 text-green-500" />
                Activos
              </p>
              <p className="text-2xl font-bold text-green-600">{active.length}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/boosts" className="block">
          <Card className="h-full transition-shadow hover:border-green-200 hover:shadow-md">
            <CardContent className="p-5">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                Programados
              </p>
              <p className="text-2xl font-bold text-yellow-600">{scheduled.length}</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/boosts" className="block">
          <Card className="h-full transition-shadow hover:border-green-200 hover:shadow-md">
            <CardContent className="p-5">
              <p className="text-sm text-gray-500 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-red-500" />
                Vencidos / Cancelados
              </p>
              <p className="text-2xl font-bold text-red-600">{other.length}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {boosts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">No tienes boosts</h3>
            <p className="mt-2 text-sm text-gray-500">
              Impulsa tus anuncios para llegar a más clientes.
            </p>
            <Button className="mt-4" render={<Link href="/dashboard/boosts/nuevo" />}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Boost
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Todos los boosts</CardTitle>
            <CardDescription>
              {active.length > 0 && `${active.length} activo${active.length > 1 ? "s" : ""}`}
              {scheduled.length > 0 &&
                `${active.length > 0 ? " · " : ""}${scheduled.length} programado${scheduled.length > 1 ? "s" : ""}`}
              {other.length > 0 &&
                `${active.length > 0 || scheduled.length > 0 ? " · " : ""}${other.length} vencido${other.length > 1 ? "s" : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Anuncio</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Duración</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fechas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enriched.map((boost) => {
                  const diffDays = Math.ceil(
                    (boost.endsAt.getTime() - boost.startsAt.getTime()) / (1000 * 60 * 60 * 24),
                  )
                  return (
                    <TableRow key={boost.id}>
                      <TableCell className="font-medium">{boost.profile.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {boost.listing?.title || "—"}
                      </TableCell>
                      <TableCell>{boost.pricePaid ? `${Number(boost.pricePaid).toLocaleString()} MXN` : "—"}</TableCell>
                      <TableCell>{diffDays} días</TableCell>
                      <TableCell>
                        <Badge className={boost._status.color}>{boost._status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {boost.startsAt.toLocaleDateString("es-MX")} —{" "}
                        {boost.endsAt.toLocaleDateString("es-MX")}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
