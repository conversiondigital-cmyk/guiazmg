import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, icon: true, _count: { select: { businesses: true } } },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ success: true, count: categories.length, categories })
}
