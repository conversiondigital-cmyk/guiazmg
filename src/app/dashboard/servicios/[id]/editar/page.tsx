export const dynamic = "force-dynamic"

import Link from "next/link"
import { notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProductForm, type EditProduct } from "@/components/dashboard/product-form"
import { ChevronLeft } from "@/lib/icons"

export default async function EditarServicioPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) return null
  const { id } = await params

  const listing = await prisma.listing.findFirst({
    where: { id, deletedAt: null, type: "SERVICE" },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      profile: { select: { ownerId: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { imageUrl: true } },
    },
  })

  // 404 si no existe, no es del usuario o no es un servicio (no se distingue).
  if (!listing || listing.profile.ownerId !== session.user.id) notFound()

  const product: EditProduct = {
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: listing.price != null ? Number(listing.price) : null,
    images: listing.images.map((i) => i.imageUrl),
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/servicios"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a servicios
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Editar servicio</h1>
      </div>

      <ProductForm product={product} kind="SERVICE" />
    </div>
  )
}
