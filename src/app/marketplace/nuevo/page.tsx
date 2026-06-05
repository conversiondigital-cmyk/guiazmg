export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { NewListingForm } from "@/components/marketplace/new-listing-form"

export default async function NewListingPage() {
  const session = await auth()
  if (!session?.user) redirect("/auth/login")

  const categories = await prisma.marketplaceCategory.findMany({
    where: { isActive: true },
    include: { children: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  })

  const municipalities = await prisma.municipality.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  })

  return (
    <>
      <Header />
      <main className="flex-1 bg-gray-50 py-8">
        <div className="mx-auto max-w-2xl px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Nueva publicación</h1>
          <NewListingForm categories={categories as any} municipalities={municipalities as any} />
        </div>
      </main>
      <Footer />
    </>
  )
}
