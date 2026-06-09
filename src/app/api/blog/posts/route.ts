import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const createSchema = z.object({
  title:           z.string().min(5).max(200),
  slug:            z.string().min(3).max(200).regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  excerpt:         z.string().max(500).optional(),
  content:         z.string(),
  coverImageUrl:   z.string().url().optional().or(z.literal("")).nullable(),
  category:        z.string().max(80).optional().nullable(),
  tags:            z.array(z.string().max(40)).max(10).optional(),
  status:          z.enum(["DRAFT", "PENDING_REVIEW"]).default("DRAFT"),
  readTimeMinutes: z.number().int().min(1).max(60).default(5),
  metaTitle:       z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
})

export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role as string | undefined
  const isAdmin  = role === "ADMIN"
  const isEditor = role === "EDITOR" || isAdmin
  const userId   = session?.user?.id

  const { searchParams } = new URL(req.url)
  const page     = Math.max(1, Number(searchParams.get("page")  ?? 1))
  const limit    = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 12)))
  const category = searchParams.get("category")  ?? undefined
  const status   = searchParams.get("status")    ?? undefined
  const search   = searchParams.get("q")         ?? undefined
  const featured = searchParams.get("featured")  === "true" ? true : undefined
  const mine     = searchParams.get("mine")      === "true"

  const where: any = {}

  if (isAdmin) {
    // Admin can filter by any status or see all
    if (status) where.status = status
  } else if (isEditor) {
    // Editors see their own posts (all statuses) OR published posts by others
    if (mine && userId) {
      where.authorId = userId
      if (status) where.status = status
    } else {
      where.status = "PUBLISHED"
    }
  } else {
    // Public: only published
    where.status = "PUBLISHED"
  }

  if (category) where.category = category
  if (featured !== undefined) where.isFeatured = featured
  if (search) {
    where.OR = [
      { title:   { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
    ]
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
      skip:  (page - 1) * limit,
      take:  limit,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        coverImageUrl: true, category: true, tags: true,
        status: true, readTimeMinutes: true, viewCount: true,
        isFeatured: true, publishedAt: true, createdAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.post.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) })
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role as string | undefined
  if (role !== "EDITOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const data = parsed.data

  const existing = await prisma.post.findUnique({ where: { slug: data.slug } })
  if (existing) return NextResponse.json({ error: "El slug ya está en uso" }, { status: 409 })

  // ADMIN can publish directly; EDITOR goes to PENDING_REVIEW
  const isAdmin = role === "ADMIN"
  const finalStatus = isAdmin && data.status === "PENDING_REVIEW" ? "PUBLISHED" : data.status

  const post = await prisma.post.create({
    data: {
      ...data,
      status: finalStatus as any,
      authorId: session!.user!.id!,
      coverImageUrl: data.coverImageUrl || null,
      publishedAt: finalStatus === "PUBLISHED" ? new Date() : null,
    },
  })

  return NextResponse.json(post, { status: 201 })
}
