export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Flag, Clock } from "@/lib/icons"
import Link from "next/link"

export default async function EditorReportesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "EDITOR" && session.user.role !== "ADMIN") redirect("/auth/login")

  const reports = await prisma.report.findMany({
    where: { status: { in: ["PENDING", "INVESTIGATING"] } },
    include: {
      user: { select: { name: true } },
      business: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reportes abiertos</h1>
      <div className="space-y-3">
        {reports.length === 0 ? (
          <p className="text-gray-400">No hay reportes pendientes</p>
        ) : reports.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Flag className="h-4 w-4 text-red-400" />
                  <span className="font-medium">{r.reason}</span>
                  <Badge className={r.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}>
                    {r.status === "PENDING" ? "Pendiente" : "Investigando"}
                  </Badge>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {r.business?.name && <Link href={`/perfil/${r.business.slug}`} className="hover:text-blue-600">{r.business.name}</Link>}
                  {" — "}Reportado por: {r.user?.name || "Anónimo"}
                </p>
              </div>
              <span className="text-xs text-gray-400"><Clock className="h-3 w-3 inline" /> {r.createdAt.toLocaleDateString("es-MX")}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
