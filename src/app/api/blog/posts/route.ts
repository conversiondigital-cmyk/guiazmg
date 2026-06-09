import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const createSchema = z.object({
  title:          z.string().min(5).max(200),
  slug:           z.string().min(3).max(200).regex(/^[a-z0-9-]+$/, "Solo letras minúsculas, números y guiones"),
  excerpt:        z.string().max(500).optional(),
  content:        z.string(),
  coverImageUrl:  z.string().url().optional().or(z.literal("")),
  category:       z.string().max(80).optional(),
  tags:           z.array(z.string().max(40)).max(10).optional(),
  status:         z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  readTimeMinutes:z.number().int().min(1).max(60).default(5),
  metaTitle:      z.string().max(70).optional(),
  metaDescription:z.string().max(160).optional(),
})

// GET /api/blog/posts — public list (published only unless editor/admin)
export async function GET(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role as string | undefined
  const isEditor = role === "EDITOR" || role === "ADMIN"

  const { searchParams } = new URL(req.url)
  const page    = Math.max(1, Number(searchParams.get("page")  ?? 1))
  const limit   = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 10)))
  const category = searchParams.get("category") ?? undefined
  const status   = searchParams.get("status") ?? undefined

  const where: any = {}

  if (!isEditor) {
    where.status = "PUBLISHED"
  } else if (status) {
    where.status = status
  }
  if (category) where.category = category

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip:  (page - 1) * limit,
      take:  limit,
      select: {
        id: true, title: true, slug: true, excerpt: true,
        coverImageUrl: true, category: true, tags: true,
        status: true, readTimeMinutes: true, publishedAt: true, createdAt: true,
        author: { select: { id: true, name: true, image: true } },
      },
    }),
    prisma.post.count({ where }),
  ])

  return NextResponse.json({ posts, total, page, totalPages: Math.ceil(total / limit) })
}

// POST /api/blog/posts — create (EDITOR or ADMIN only)
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

  // Check slug uniqueness
  const existing = await prisma.post.findUnique({ where: { slug: data.slug } })
  if (existing) {
    return NextResponse.json({ error: "El slug ya está en uso" }, { status: 409 })
  }

  const post = await prisma.post.create({
    data: {
      ...data,
      authorId: session!.user!.id!,
      coverImageUrl: data.coverImageUrl || null,
      publishedAt: data.status === "PUBLISHED" ? new Date() : null,
    },
  })

  return NextResponse.json(post, { status: 201 })
}
