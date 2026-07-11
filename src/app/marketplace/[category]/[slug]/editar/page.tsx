export const dynamic = "force-dynamic"

import { redirect, notFound } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { NewListingForm } from "@/components/marketplace/new-listing-form"

export default async function EditListingPage({ params }: { params: Promise<{ category: string; slug: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/auth/login")
  const { slug } = await params

  const listing = await prisma.marketplaceListing.findUnique({
    where: { slug },
    include: {
      category: { select: { slug: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
    },
  })
  if (!listing || listing.deletedAt) notFound()
  if (listing.userId !== session.user.id) redirect("/dashboard/marketplace")

  const [categories, municipalities] = await Promise.all([
    prisma.marketplaceCategory.findMany({
      where: { isActive: true },
      include: { children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.municipality.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ])

  const initial = {
    id: listing.id,
    slug: listing.slug,
    categorySlug: listing.category.slug,
    title: listing.title,
    description: listing.description,
    price: listing.price != null ? Number(listing.price) : null,
    type: listing.type,
    categoryId: listing.categoryId,
    municipalityId: listing.municipalityId,
    neighborhood: listing.neighborhood,
    phone: listing.phone,
    whatsapp: listing.whatsapp,
    contactEmail: listing.contactEmail,
    images: listing.images,
  }

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar publicación</h1>
          <NewListingForm categories={categories as any} municipalities={municipalities as any} listing={initial as any} />
        </div>
      </main>
      <Footer />
    </>
  )
}
