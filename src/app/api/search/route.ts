import { NextRequest, NextResponse } from "next/server"
import { search } from "@/lib/search/search-engine"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const searchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.string().trim().max(120).optional(),
  municipality: z.string().trim().max(120).optional(),
  neighborhood: z.string().trim().max(120).optional(),
  subcategory: z.string().trim().max(120).optional(),
  lat: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().min(-90).max(90).optional()),
  lng: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().min(-180).max(180).optional()),
  page: z.preprocess((v) => (v === "" || v === undefined ? 1 : Number(v)), z.number().int().min(1).max(100).default(1)),
  limit: z.preprocess((v) => (v === "" || v === undefined ? 20 : Number(v)), z.number().int().min(1).max(50).default(20)),
  sort: z.enum(["relevance", "distance", "rating", "newest"]).default("relevance"),
  openNow: z.preprocess((v) => v === "true", z.boolean()).default(false),
  verified: z.preprocess((v) => v === "true", z.boolean()).default(false),
  premium: z.preprocess((v) => v === "true", z.boolean()).default(false),
  minRating: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().min(0).max(5).optional()),
  maxDistance: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().positive().max(200).optional()),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = searchSchema.safeParse(Object.fromEntries(searchParams.entries()))

    if (!parsed.success) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }

    const { q, category, municipality, neighborhood, subcategory, lat, lng, page, limit, sort, openNow, verified, premium, minRating, maxDistance } = parsed.data

    const results = await search({
      q, category, municipality, neighborhood, subcategory,
      lat, lng, page, limit, sort,
      isOpenNow: openNow, isVerified: verified, isPremium: premium, minRating, maxDistance,
    })

    if (typeof q === "string" && q.trim()) {
      try {
        const session = await auth()
        await prisma.searchLog.create({
          data: {
            query: q.trim(),
            municipality: municipality,
            neighborhood: neighborhood,
            userId: session?.user?.id,
            resultsCount: results.total,
          },
        })
      } catch (error) {
        console.error("[SEARCH_LOG_ERROR]", error instanceof Error ? error.message : String(error))
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json({ error: "Error al realizar la búsqueda" }, { status: 500 })
  }
}
