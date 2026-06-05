export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Zap } from "@/lib/icons"
import BoostWizard from "@/components/dashboard/boost-wizard"

export default async function NuevoBoostPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")

  const businesses = await prisma.business.findMany({
    where: { ownerId: session.user.id },
    select: { id: true, name: true },
  })

  const businessIds = businesses.map((b) => b.id)

  const listings =
    businessIds.length > 0
      ? await prisma.listing.findMany({
          where: { businessId: { in: businessIds } },
          select: { id: true, title: true, status: true },
        })
      : []

  const boostDefinitions = await prisma.boostDefinition.findMany({
    where: { isActive: true },
    orderBy: { durationDays: "asc" },
  })

  if (businesses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nuevo Boost</h1>
          <p className="text-gray-500">Crea un boost para impulsar tu negocio</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="mx-auto h-12 w-12 text-gray-300" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Sin negocios registrados
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Necesitas tener al menos un negocio registrado para crear un boost.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nuevo Boost</h1>
        <p className="text-gray-500">Crea un boost para impulsar tu negocio</p>
      </div>

      <BoostWizard
        businesses={businesses}
        listings={listings}
        boostDefinitions={boostDefinitions.map((d) => ({
          id: d.id,
          name: d.name,
          durationDays: d.durationDays,
          price: Number(d.price),
          priorityBonus: d.priorityBonus,
        }))}
      />
    </div>
  )
}
