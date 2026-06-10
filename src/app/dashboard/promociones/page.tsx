export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Plus, Calendar, Gift } from "@/lib/icons"
import Link from "next/link"

export default async function PromocionesPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const businesses = await prisma.profile.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  })
  const businessIds = businesses.map((b) => b.id)
  const bizMap = Object.fromEntries(businesses.map((b) => [b.id, b]))

  const coupons = businessIds.length > 0
    ? await prisma.coupon.findMany({
        where: { businessId: { in: businessIds } },
        orderBy: { createdAt: "desc" },
      })
    : []

  const active = coupons.filter((c) => c.isActive && (!c.endDate || c.endDate >= new Date()))
  const expired = coupons.filter((c) => !c.isActive || (c.endDate && c.endDate < new Date()))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Promociones</h1>
          <p className="text-gray-500">Crea y administra tus promociones y cupones</p>
        </div>
        <Link href="/dashboard/promociones/nuevo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva promoción
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold">{coupons.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Activas</p>
            <p className="text-2xl font-bold text-green-600">{active.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-gray-500">Expiradas</p>
            <p className="text-2xl font-bold text-red-600">{expired.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Promotions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Gift className="h-5 w-5 text-green-500" />
            Promociones activas
          </CardTitle>
          <CardDescription>Promociones vigentes que los usuarios pueden ver</CardDescription>
        </CardHeader>
        <CardContent>
          {active.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No hay promociones activas</p>
          ) : (
            <div className="space-y-4">
              {active.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border p-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{c.title}</h3>
                    <p className="text-sm text-gray-500">{bizMap[c.businessId]?.name ?? ""}</p>
                    {c.description && <p className="text-sm text-gray-600 mt-1">{c.description}</p>}
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      {c.code && <span>Código: <strong>{c.code}</strong></span>}
                      {c.startDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(c.startDate).toLocaleDateString("es-MX")}
                          {c.endDate && ` - ${new Date(c.endDate).toLocaleDateString("es-MX")}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">Activa</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expired */}
      {expired.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Promociones expiradas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {expired.map((c) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 opacity-60">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">{c.title}</h3>
                    <p className="text-xs text-gray-400">{bizMap[c.businessId]?.name ?? ""}</p>
                  </div>
                  <Badge className="bg-gray-100 text-gray-500">Expirada</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
