export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from "@/components/ui/table"
import { Tag } from "@/lib/icons"
import { GiroSuggestionActions } from "./giro-suggestions-client"

const statusInfo: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-amber-100 text-amber-800 border-amber-200" },
  APPROVED: { label: "Agregada", className: "bg-green-100 text-green-800 border-green-200" },
  REJECTED: { label: "Rechazada", className: "bg-red-100 text-red-800 border-red-200" },
}

export default async function GirosSolicitudesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard")

  const suggestions = await prisma.giroSuggestion.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 200,
  })
  const pendientes = suggestions.filter((s) => s.status === "PENDING").length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Solicitudes de giro</h1>
        <p className="text-gray-500">
          Giros que los usuarios no encontraron en el catálogo y pidieron agregar.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Tag className="h-5 w-5 text-[#006c49]" />
            Solicitudes
            {pendientes > 0 && (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">{pendientes} pendientes</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {suggestions.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">Aún no hay solicitudes de giro.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Giro solicitado</TableHead>
                  <TableHead>Categoría sugerida</TableHead>
                  <TableHead>Negocio</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suggestions.map((s) => {
                  const info = statusInfo[s.status] ?? { label: s.status, className: "" }
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">
                        {s.name}
                        {s.note && <p className="mt-0.5 text-xs font-normal text-gray-500">{s.note}</p>}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{s.categoryHint || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{s.businessName || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">{s.contactEmail || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={info.className}>{info.label}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {s.createdAt.toLocaleDateString("es-MX")}
                      </TableCell>
                      <TableCell>
                        <GiroSuggestionActions id={s.id} currentStatus={s.status} />
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
