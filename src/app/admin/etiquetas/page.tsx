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

export default async function AdminEtiquetasPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const tags = await prisma.tag.findMany({
    include: { _count: { select: { businesses: true } } },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Etiquetas / Tags</h1>
        <p className="text-sm text-muted-foreground">
          Etiquetas que se pueden asignar a perfiles comerciales para mejorar la clasificación
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total etiquetas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tags.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Etiquetas activas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{tags.filter((t) => t.isActive).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Todas las etiquetas</CardTitle>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">No hay etiquetas creadas aún</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Perfiles</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow key={tag.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {tag.icon && <span>{tag.icon}</span>}
                        {tag.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{tag.slug}</TableCell>
                    <TableCell>{tag._count.businesses}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={tag.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}>
                        {tag.isActive ? "Activa" : "Inactiva"}
                      </Badge>
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
