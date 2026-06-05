export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify } from "@/lib/utils"
import { z } from "zod"

const blankToNull = (value: unknown) => (value === "" || value === undefined ? null : value)

const listingSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().max(5000).optional().nullable(),
  price: z.preprocess(blankToNull, z.coerce.number().nonnegative().max(9999999).optional().nullable()),
  type: z.enum(["SALE", "PURCHASE", "TRADE", "SERVICE", "REQUEST", "EVENT", "PROMOTION"]),
  categoryId: z.string().cuid(),
  municipalityId: z.string().cuid().optional().nullable(),
  neighborhood: z.preprocess(blankToNull, z.string().trim().max(120).optional().nullable()),
  phone: z.preprocess(blankToNull, z.string().trim().max(30).optional().nullable()),
  whatsapp: z.preprocess(blankToNull, z.string().trim().max(30).optional().nullable()),
  contactEmail: z.preprocess(blankToNull, z.string().email().optional().nullable()),
  images: z.array(z.object({ url: z.string().url(), sortOrder: z.number().int().nonnegative().optional() })).max(10).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { title, description, price, type, categoryId, municipalityId, neighborhood, phone, whatsapp, contactEmail, images } = listingSchema.parse(await request.json())

    const slug = `${slugify(title)}-${Date.now()}`

    const listing = await prisma.marketplaceListing.create({
      data: {
        title,
        slug,
        description,
        price: price ?? null,
        type,
        categoryId,
        municipalityId,
        neighborhood,
        phone,
        whatsapp,
        contactEmail,
        userId: session.user.id,
        images: images?.length
          ? { createMany: { data: images.map((img, i) => ({ url: img.url, sortOrder: img.sortOrder ?? i })) } }
          : undefined,
      },
      include: {
        images: { orderBy: { sortOrder: "asc" } },
        category: { select: { name: true, slug: true, icon: true } },
      },
    })

    return NextResponse.json(listing, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    return NextResponse.json({ error: "Error al crear el anuncio" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const querySchema = z.object({
      category: z.string().trim().max(120).optional(),
      municipality: z.string().trim().max(120).optional(),
      q: z.string().trim().max(200).optional(),
      type: z.enum(["SALE", "PURCHASE", "TRADE", "SERVICE", "REQUEST", "EVENT", "PROMOTION"]).optional(),
      minPrice: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().nonnegative().max(9999999).optional()),
      maxPrice: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().nonnegative().max(9999999).optional()),
      sort: z.enum(["newest", "price_asc", "price_desc"]).default("newest"),
      page: z.preprocess((v) => (v === "" || v === undefined ? 1 : Number(v)), z.number().int().min(1).max(100).default(1)),
      limit: z.preprocess((v) => (v === "" || v === undefined ? 20 : Number(v)), z.number().int().min(1).max(50).default(20)),
    })

    const parsed = querySchema.safeParse(Object.fromEntries(searchParams.entries()))
    if (!parsed.success) {
      return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 })
    }

    const { category, municipality, q, type, minPrice, maxPrice, sort, page, limit } = parsed.data

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return NextResponse.json({ error: "Rango de precio inválido" }, { status: 400 })
    }

    const where: any = {
      status: "ACTIVE",
      deletedAt: null,
    }

    if (q) {
      where.title = { contains: q, mode: "insensitive" }
    }
    if (category) {
      where.categoryId = category
    }
    if (municipality) {
      where.municipalityId = municipality
    }
    if (type) {
      where.type = type
    }
    if (minPrice !== undefined) {
      where.price = { ...where.price, gte: minPrice }
    }
    if (maxPrice !== undefined) {
      where.price = { ...where.price, lte: maxPrice }
    }

    let orderBy: any
    switch (sort) {
      case "price_asc":
        orderBy = { price: "asc" }
        break
      case "price_desc":
        orderBy = { price: "desc" }
        break
      default:
        orderBy = { createdAt: "desc" }
    }

    const skip = (page - 1) * limit

    const [listings, total] = await Promise.all([
      prisma.marketplaceListing.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: { select: { name: true, slug: true, icon: true } },
          user: { select: { name: true, image: true } },
          images: { orderBy: { sortOrder: "asc" } },
          _count: { select: { favorites: true } },
        },
      }),
      prisma.marketplaceListing.count({ where }),
    ])

    return NextResponse.json({
      listings,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    })
  } catch {
    return NextResponse.json({ error: "Error al obtener anuncios" }, { status: 500 })
  }
}
