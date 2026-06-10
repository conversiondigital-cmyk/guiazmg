import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { Tag } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminPromocionesPage() {
  const session = await auth()
  if (!session?.user || !["ADMIN", "EDITOR"].includes(session.user.role ?? "")) {
    redirect("/auth/login")
  }

  const now = new Date()

  const coupons = await prisma.coupon.findMany({
    include: {
      profile: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  })

  const stats = {
    total: coupons.length,
    active: coupons.filter((c) => c.isActive).length,
    expired: coupons.filter((c) => c.endDate && new Date(c.endDate) < now).length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Promociones comerciales</h1>
        <p className="text-sm text-muted-foreground">
          Ofertas y promociones publicadas por perfiles comerciales en la plataforma.
          No confundir con cupones de descuento administrativos (/admin/cupones).
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Activas", value: stats.active },
          { label: "Vencidas", value: stats.expired },
        ].map((s) => (
          <Card key={s.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{s.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todas las promociones</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                No hay promociones publicadas aún
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Perfil</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.map((c) => {
                  const expired = c.endDate && new Date(c.endDate) < now
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.title}</TableCell>
                      <TableCell className="text-muted-foreground">{c.profile.name}</TableCell>
                      <TableCell>
                        {c.code ? (
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{c.code}</code>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {c.startDate
                          ? new Date(c.startDate).toLocaleDateString("es-MX")
                          : "—"}{" "}
                        →{" "}
                        {c.endDate
                          ? new Date(c.endDate).toLocaleDateString("es-MX")
                          : "Sin vencimiento"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            expired
                              ? "bg-red-100 text-red-700"
                              : c.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-600"
                          }
                        >
                          {expired ? "Vencida" : c.isActive ? "Activa" : "Inactiva"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
