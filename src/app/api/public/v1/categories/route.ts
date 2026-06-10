import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { apiLimiter } from "@/lib/security/rate-limit"

export async function GET(req: Request) {
  const rl = await apiLimiter(req)
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rl.resetTime - Date.now()) / 1000))) } }
    )
  }

  const categories = await prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, icon: true, _count: { select: { businesses: true } } },
    orderBy: { name: "asc" },
  })

  return NextResponse.json({ success: true, count: categories.length, categories })
}
