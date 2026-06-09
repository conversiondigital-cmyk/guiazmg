import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

const updateSchema = z.object({
  title:           z.string().min(5).max(200).optional(),
  slug:            z.string().min(3).max(200).regex(/^[a-z0-9-]+$/).optional(),
  excerpt:         z.string().max(500).nullable().optional(),
  content:         z.string().optional(),
  coverImageUrl:   z.string().url().nullable().optional().or(z.literal("")),
  category:        z.string().max(80).nullable().optional(),
  tags:            z.array(z.string().max(40)).max(10).optional(),
  status:          z.enum(["DRAFT", "PENDING_REVIEW", "PUBLISHED", "REJECTED", "ARCHIVED"]).optional(),
  readTimeMinutes: z.number().int().min(1).max(60).optional(),
  metaTitle:       z.string().max(70).nullable().optional(),
  metaDescription: z.string().max(160).nullable().optional(),
  isFeatured:      z.boolean().optional(),
})

async function getSessionAndRole(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role as string | undefined
  return { session, role }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      author:     { select: { id: true, name: true, image: true, email: true } },
      reviewedBy: { select: { id: true, name: true } },
    },
  })
  if (!post) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(post)
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, role } = await getSessionAndRole(req)
  if (role !== "EDITOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const existing = await prisma.post.findUnique({
    where: { id },
    select: { status: true, publishedAt: true, authorId: true },
  })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  // Editors can only edit their own posts (unless admin)
  if (role === "EDITOR" && existing.authorId !== session?.user?.id) {
    return NextResponse.json({ error: "Solo puedes editar tus propios artículos" }, { status: 403 })
  }

  // Editors cannot set published/rejected status directly
  if (role === "EDITOR" && parsed.data.status === "PUBLISHED") {
    return NextResponse.json({ error: "Los editores deben enviar a revisión primero" }, { status: 403 })
  }

  const data: any = { ...parsed.data }
  if (data.coverImageUrl === "") data.coverImageUrl = null

  // Handle publishedAt
  if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED" && !existing.publishedAt) {
    data.publishedAt = new Date()
  }

  // Handle featured
  if (data.isFeatured === true && !existing.publishedAt) {
    data.featuredAt = new Date()
  } else if (data.isFeatured === false) {
    data.featuredAt = null
  }

  const post = await prisma.post.update({ where: { id }, data })
  return NextResponse.json(post)
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { session, role } = await getSessionAndRole(req)
  if (role !== "EDITOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { id } = await params
  const existing = await prisma.post.findUnique({ where: { id }, select: { authorId: true } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  if (role === "EDITOR" && existing.authorId !== session?.user?.id) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
