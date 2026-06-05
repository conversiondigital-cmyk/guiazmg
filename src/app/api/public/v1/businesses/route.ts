import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const paginationSchema = z.object({
  page: z.preprocess((v) => (v === "" || v === undefined ? 1 : Number(v)), z.number().int().min(1).max(100).default(1)),
  take: z.preprocess((v) => (v === "" || v === undefined ? 20 : Number(v)), z.number().int().min(1).max(50).default(20)),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parsed = paginationSchema.safeParse(Object.fromEntries(searchParams.entries()))
  if (!parsed.success) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
  }

  const { page, take } = parsed.data
  const skip = (page - 1) * take

  if (skip > 2000) {
    return NextResponse.json({ error: "Paginación demasiado profunda" }, { status: 400 })
  }

  const businesses = await prisma.business.findMany({
    where: { status: "ACTIVE", deletedAt: null },
    select: {
      id: true,
      name: true,
      slug: true,
      shortDescription: true,
      phone: true,
      whatsapp: true,
      websiteUrl: true,
      addressText: true,
      municipality: { select: { name: true, slug: true } },
      neighborhood: { select: { name: true, slug: true } },
      category: { select: { name: true, slug: true } },
      isVerified: true,
      isFeatured: true,
      createdAt: true,
    },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    take,
    skip,
  })

  return NextResponse.json({
    success: true,
    count: businesses.length,
    businesses,
    pagination: { page, take, skip },
  })
}
