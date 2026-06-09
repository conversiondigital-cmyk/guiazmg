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
  status:          z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  readTimeMinutes: z.number().int().min(1).max(60).optional(),
  metaTitle:       z.string().max(70).nullable().optional(),
  metaDescription: z.string().max(160).nullable().optional(),
})

async function requireEditor(req: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role as string | undefined
  if (role !== "EDITOR" && role !== "ADMIN") return null
  return session
}

// GET /api/blog/posts/[id]
export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const post = await prisma.post.findUnique({
    where: { id },
    include: { author: { select: { id: true, name: true, image: true } } },
  })
  if (!post) return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  return NextResponse.json(post)
}

// PATCH /api/blog/posts/[id]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireEditor(req)
  if (!session) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const data = parsed.data

  // If publishing for first time, set publishedAt
  const existing = await prisma.post.findUnique({ where: { id }, select: { status: true, publishedAt: true } })
  if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const updates: any = { ...data }
  if (data.coverImageUrl === "") updates.coverImageUrl = null

  if (data.status === "PUBLISHED" && existing.status !== "PUBLISHED" && !existing.publishedAt) {
    updates.publishedAt = new Date()
  }

  const post = await prisma.post.update({ where: { id }, data: updates })
  return NextResponse.json(post)
}

// DELETE /api/blog/posts/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireEditor(req)
  if (!session) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })

  const { id } = await params
  await prisma.post.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
