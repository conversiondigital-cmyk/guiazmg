import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const popular = await prisma.searchLog.groupBy({
      by: ["query"],
      _count: { query: true },
      orderBy: { _count: { query: "desc" } },
      take: 20,
      where: {
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    })

    return NextResponse.json(
      popular.map((p) => ({ query: p.query, count: p._count.query }))
    )
  } catch {
    return NextResponse.json([])
  }
}
