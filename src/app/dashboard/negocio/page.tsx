export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BusinessEditForm } from "@/components/dashboard/business-edit-form"

export default async function MiNegocioPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const business = await prisma.profile.findFirst({
    where: { ownerId: session.user.id, deletedAt: null },
    include: {
      municipality: true,
      neighborhood: true,
      category: true,
      subcategory: true,
      memberships: { include: { plan: true } },
      hours: { orderBy: { dayOfWeek: "asc" } },
      tags: { include: { tag: true } },
      coupons: true,
      _count: { select: { reviews: true } },
    },
  })

  if (!business) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No tienes un negocio registrado</h2>
        <p className="text-gray-500 mt-2">Registra tu negocio para aparecer en Guía ZMG</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Negocio</h1>
          <p className="text-gray-500">Administra la información de tu negocio</p>
        </div>
      </div>
      <BusinessEditForm business={business} />
    </div>
  )
}
