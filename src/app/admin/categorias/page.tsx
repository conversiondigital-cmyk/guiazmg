import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CategoriesClient } from "./categories-client"

export const dynamic = "force-dynamic"

async function getCategories() {
  const categories = await prisma.category.findMany({
    include: {
      subcategories: {
        include: {
          _count: { select: { businesses: true, listings: true } },
        },
        orderBy: { sortOrder: "asc" },
      },
      _count: { select: { subcategories: true, businesses: true, listings: true } },
    },
    orderBy: { sortOrder: "asc" },
  })
  return JSON.parse(JSON.stringify(categories))
}

export default async function AdminCategoriasPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const categories = await getCategories()

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <CategoriesClient categories={categories} />
    </Suspense>
  )
}
