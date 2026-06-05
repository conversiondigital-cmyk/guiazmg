export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Store, Clock } from "@/lib/icons"
import Link from "next/link"

export default async function EditorNegociosPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "EDITOR" && session.user.role !== "ADMIN") redirect("/auth/login")

  const businesses = await prisma.business.findMany({
    where: { status: "PENDING_REVIEW" },
    include: {
      owner: { select: { name: true, email: true } },
      category: { select: { name: true } },
      municipality: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Negocios pendientes de revisión</h1>
      <div className="space-y-3">
        {businesses.length === 0 ? (
          <p className="text-gray-400">No hay negocios pendientes</p>
        ) : businesses.map((b) => (
          <Card key={b.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-gray-400" />
                  <Link href={`/admin/negocios/${b.id}`} className="font-medium hover:text-blue-600">{b.name}</Link>
                  <Badge variant="secondary">{b.category?.name}</Badge>
                  {b.municipality && <span className="text-xs text-gray-400">{b.municipality.name}</span>}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Creado por: {b.owner?.name || "—"} ({b.owner?.email || "—"})
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400"><Clock className="h-3 w-3 inline" /> {b.createdAt.toLocaleDateString("es-MX")}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
