import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CategoriesClient } from "./categories-client"

export const dynamic = "force-dynamic"

async function getCategories() {
  const categories = await prisma.category.findMany({
    include: {
      subcategories: {
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          isActive: true,
          sortOrder: true,
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

  return <CategoriesClient categories={categories} />
}
