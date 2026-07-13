export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ProductForm } from "@/components/dashboard/product-form"
import { ChevronLeft } from "@/lib/icons"

export default async function NuevoProductoPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const business = await prisma.profile.findFirst({
    where: { ownerId: session.user.id, deletedAt: null },
    select: { id: true, categoryId: true },
  })

  // Sin negocio no hay dónde colgar el producto: manda a registrar/completar.
  if (!business) redirect("/dashboard/negocio")

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <Link
          href="/dashboard/productos"
          className="mb-2 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Volver a productos
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Agregar producto</h1>
        <p className="text-gray-500">Aparecerá en el catálogo de tu perfil público.</p>
      </div>

      {!business.categoryId ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Tu negocio necesita una categoría antes de agregar productos.{" "}
          <Link href="/dashboard/negocio" className="font-medium underline">
            Edítalo aquí
          </Link>
          .
        </div>
      ) : (
        <ProductForm />
      )}
    </div>
  )
}
