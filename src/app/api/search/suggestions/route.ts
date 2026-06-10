import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const q = searchParams.get("q") || ""
    const limit = Math.min(parseInt(searchParams.get("limit") || "8"), 20)

    if (!q.trim()) {
      const popular = await prisma.searchLog.groupBy({
        by: ["query"],
        _count: { query: true },
        orderBy: { _count: { query: "desc" } },
        take: limit,
      })
      return NextResponse.json(popular.map((p) => p.query))
    }

    const query = q.toLowerCase()

    const [nameResults, categoryResults, tagResults] = await Promise.all([
      prisma.profile.findMany({
        where: {
          status: "ACTIVE",
          name: { contains: query, mode: "insensitive" },
        },
        select: { name: true },
        take: limit,
        orderBy: [{ isVerified: "desc" }, { isFeatured: "desc" }],
      }),
      prisma.category.findMany({
        where: { name: { contains: query, mode: "insensitive" }, isActive: true },
        select: { name: true, slug: true },
        take: 4,
      }),
      prisma.tag.findMany({
        where: { name: { contains: query, mode: "insensitive" }, isActive: true },
        select: { name: true },
        take: 4,
      }),
    ])

    const suggestions = new Set<string>()
    categoryResults.forEach((c) => suggestions.add(c.name))
    tagResults.forEach((t) => suggestions.add(t.name))
    nameResults.forEach((b) => suggestions.add(b.name))

    return NextResponse.json(Array.from(suggestions).slice(0, limit))
  } catch {
    return NextResponse.json([])
  }
}
