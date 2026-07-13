export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { BoostMarketplaceForm } from "@/components/marketplace/boost-marketplace-form"
import { ChevronLeft } from "@/lib/icons"

export default async function DestacarPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return null
  const { id } = await params

  // La publicación debe ser del usuario.
  const listing = await prisma.marketplaceListing.findFirst({
    where: { id, userId: session.user.id, deletedAt: null },
    select: { id: true, title: true, status: true },
  })
  if (!listing) notFound()

  const defs = await prisma.boostDefinition.findMany({
    where: { isActive: true },
    orderBy: { durationDays: "asc" },
    select: { id: true, name: true, durationDays: true, price: true },
  })
  const options = defs.map((d) => ({ ...d, price: Number(d.price) }))

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/marketplace"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a mis publicaciones
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Destacar publicación</h1>
        <p className="text-gray-500">
          &ldquo;{listing.title}&rdquo; aparecerá primero en el marketplace mientras dure el boost.
        </p>
      </div>

      {options.length === 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No hay planes de boost disponibles por ahora.
        </div>
      ) : (
        <BoostMarketplaceForm listingId={listing.id} options={options} />
      )}
    </div>
  )
}
