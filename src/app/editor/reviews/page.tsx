export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Star, Clock } from "@/lib/icons"
import Link from "next/link"

export default async function EditorReviewsPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "EDITOR" && session.user.role !== "ADMIN") redirect("/auth/login")

  const reviews = await prisma.review.findMany({
    where: { status: "PENDING" },
    include: {
      user: { select: { name: true } },
      business: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Reseñas pendientes de aprobación</h1>
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <p className="text-gray-400">No hay reseñas pendientes</p>
        ) : reviews.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.title || "Sin título"}</span>
                    <div className="flex">
                      {Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 text-amber-400 fill-amber-400" />)}
                    </div>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                  <p className="text-xs text-gray-400 mt-1">
                    <Link href={`/perfil/${r.business.slug}`} className="hover:text-blue-600">{r.business.name}</Link>
                    {" — "}Por: {r.user?.name || "Anónimo"}
                  </p>
                </div>
                <span className="text-xs text-gray-400"><Clock className="h-3 w-3 inline" /> {r.createdAt.toLocaleDateString("es-MX")}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
