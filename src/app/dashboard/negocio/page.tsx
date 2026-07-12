export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BusinessEditForm } from "@/components/dashboard/business-edit-form"
import { VerificationCard } from "@/components/dashboard/verification-card"
import { getVerificationMode } from "@/lib/verification-config"
import { getGoogleMapsApiKey } from "@/lib/maps-config"
import Link from "next/link"

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
      images: { orderBy: { sortOrder: "asc" } },
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

  const [verificationMode, mapsApiKey, categories] = await Promise.all([
    getVerificationMode(),
    getGoogleMapsApiKey(),
    prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        subcategories: {
          where: { isActive: true },
          select: { id: true, name: true },
          orderBy: { sortOrder: "asc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Negocio</h1>
          <p className="text-gray-500">Administra la información de tu negocio</p>
        </div>
        <Link
          href={`/perfil/${business.slug}`}
          className="text-sm font-medium text-green-700 transition-colors hover:text-green-800 hover:underline"
        >
          Ver perfil público
        </Link>
      </div>
      {business.status !== "ACTIVE" && (
        <div className="flex flex-col gap-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <span className="font-semibold">Tu negocio está en revisión.</span>
          <span>
            Aún no aparece en el directorio público (por eso su enlace da 404 a otras personas). Un administrador
            lo revisará y, al aprobarlo, será visible para todos. Puedes ver cómo quedará en{" "}
            <Link href={`/perfil/${business.slug}`} className="font-medium underline">tu perfil (vista previa)</Link>.
          </span>
        </div>
      )}
      <VerificationCard
        businessId={business.id}
        status={business.verificationStatus}
        isVerified={business.isVerified}
        mode={verificationMode}
      />
      <BusinessEditForm business={business} categories={categories} mapsApiKey={mapsApiKey} />
    </div>
  )
}
