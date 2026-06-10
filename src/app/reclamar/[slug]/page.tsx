export const dynamic = "force-dynamic"

import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClaimForm } from "./claim-form"

export default async function ClaimBusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const business = await prisma.profile.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true, status: true },
  })

  if (!business) notFound()

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Reclamar este negocio</h1>
          <p className="text-gray-500 mt-1">
            ¿Eres el propietario de <strong>{business.name}</strong>? Completa este formulario para reclamar la propiedad del perfil.
          </p>
        </div>
        <ClaimForm businessId={business.id} businessName={business.name} businessSlug={business.slug} />
      </div>
    </div>
  )
}
