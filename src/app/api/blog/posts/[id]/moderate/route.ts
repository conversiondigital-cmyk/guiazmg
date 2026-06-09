/**
 * POST /api/blog/posts/[id]/moderate
 * Body: { action: "approve" | "reject" | "feature" | "unfeature" | "archive" | "submit", reason?: string }
 * Only ADMIN can approve/reject/feature. Editors can submit their own posts.
 */
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { z } from "zod"

/** Fire-and-forget notification helper */
async function sendNotification(userId: string, title: string, message?: string) {
  try {
    await (prisma as any).notification.create({
      data: { userId, title, message: message ?? null, type: "SYSTEM", isRead: false },
    })
  } catch { /* non-critical */ }
}

const schema = z.object({
  action: z.enum(["approve", "reject", "feature", "unfeature", "archive", "submit"]),
  reason: z.string().max(500).optional(),
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  const role = (session?.user as any)?.role as string | undefined
  const userId = session?.user?.id

  if (!userId) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { action, reason } = parsed.data

  const post = await prisma.post.findUnique({
    where: { id },
    select: { status: true, authorId: true, title: true },
  })
  if (!post) return NextResponse.json({ error: "No encontrado" }, { status: 404 })

  const isAdmin  = role === "ADMIN"
  const isEditor = role === "EDITOR" || isAdmin
  const isOwner  = post.authorId === userId

  // Submit: editor sends their own draft to review
  if (action === "submit") {
    if (!isEditor) return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
    if (!isOwner && !isAdmin) return NextResponse.json({ error: "Solo el autor puede enviar a revisión" }, { status: 403 })
    if (post.status !== "DRAFT" && post.status !== "REJECTED") {
      return NextResponse.json({ error: "Solo se pueden enviar borradores o artículos rechazados" }, { status: 409 })
    }
    const updated = await prisma.post.update({
      where: { id },
      data: { status: "PENDING_REVIEW", rejectionReason: null },
    })
    // Notify admins that a post is pending review
    const admins = await (prisma as any).user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    })
    for (const admin of admins) {
      void sendNotification(admin.id, "Artículo pendiente de revisión", `"${post.title}" fue enviado a revisión.`)
    }
    return NextResponse.json(updated)
  }

  // All other actions require ADMIN
  if (!isAdmin) return NextResponse.json({ error: "Solo administradores pueden moderar" }, { status: 403 })

  let data: any = {}

  switch (action) {
    case "approve":
      data = {
        status: "PUBLISHED",
        reviewedById: userId,
        reviewedAt: new Date(),
        rejectionReason: null,
        publishedAt: post.status !== "PUBLISHED" ? new Date() : undefined,
      }
      break

    case "reject":
      if (!reason) return NextResponse.json({ error: "Se requiere motivo de rechazo" }, { status: 400 })
      data = {
        status: "REJECTED",
        reviewedById: userId,
        reviewedAt: new Date(),
        rejectionReason: reason,
      }
      break

    case "feature":
      data = { isFeatured: true, featuredAt: new Date() }
      break

    case "unfeature":
      data = { isFeatured: false, featuredAt: null }
      break

    case "archive":
      data = { status: "ARCHIVED" }
      break

    default:
      return NextResponse.json({ error: "Acción inválida" }, { status: 400 })
  }

  const updated = await prisma.post.update({ where: { id }, data })

  // Notify the author of the result
  if (action === "approve") {
    void sendNotification(
      post.authorId,
      "Artículo aprobado y publicado",
      `Tu artículo "${post.title}" fue aprobado y ya está visible en el blog.`
    )
  } else if (action === "reject") {
    void sendNotification(
      post.authorId,
      "Artículo rechazado",
      `Tu artículo "${post.title}" fue rechazado. Motivo: ${reason}`
    )
  } else if (action === "archive") {
    void sendNotification(
      post.authorId,
      "Artículo archivado",
      `Tu artículo "${post.title}" fue archivado.`
    )
  }

  return NextResponse.json(updated)
}
