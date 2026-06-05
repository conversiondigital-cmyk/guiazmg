export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Clock } from "@/lib/icons"
import Link from "next/link"

export default async function EditorMarketplacePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "EDITOR" && session.user.role !== "ADMIN") redirect("/auth/login")

  const items = await prisma.marketplaceListing.findMany({
    where: { deletedAt: null },
    include: {
      category: { select: { name: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return (
    <div className="p-6 lg:p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Marketplace</h1>
      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="text-gray-400">No hay listados</p>
        ) : items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-gray-400" />
                  <Link href={`/marketplace/${item.category?.slug || "general"}/${item.slug}`} className="font-medium hover:text-blue-600">{item.title}</Link>
                  <Badge variant="secondary">{item.category?.name}</Badge>
                  <Badge className={item.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>{item.status}</Badge>
                </div>
                <p className="text-xs text-gray-400 mt-1">Por: {item.user?.name || "—"}</p>
              </div>
              <span className="text-xs text-gray-400"><Clock className="h-3 w-3 inline" /> {item.createdAt.toLocaleDateString("es-MX")}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
