export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const blankToNull = (v: unknown) => (v === "" || v === undefined ? null : v)

const updateSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  description: z.preprocess(blankToNull, z.string().trim().max(5000).nullable().optional()),
  price: z.coerce.number().min(20, "El precio mínimo es $20").max(9999999).optional(),
  type: z.enum(["SALE", "PURCHASE", "TRADE", "SERVICE", "REQUEST", "EVENT", "PROMOTION"]).optional(),
  categoryId: z.string().cuid().optional(),
  municipalityId: z.preprocess(blankToNull, z.string().cuid().nullable().optional()),
  neighborhood: z.preprocess(blankToNull, z.string().trim().max(120).nullable().optional()),
  phone: z.preprocess(blankToNull, z.string().trim().max(30).nullable().optional()),
  whatsapp: z.preprocess(blankToNull, z.string().trim().max(30).nullable().optional()),
  contactEmail: z.preprocess(blankToNull, z.string().email().nullable().optional()),
  images: z.array(z.object({ url: z.string().url(), sortOrder: z.number().int().nonnegative().optional() })).max(10).optional(),
})

// Devuelve el listing solo si es del usuario y no está borrado (ownership).
async function ownedListing(id: string, userId: string) {
  const l = await prisma.marketplaceListing.findUnique({
    where: { id },
    select: { id: true, userId: true, deletedAt: true },
  })
  return l && !l.deletedAt && l.userId === userId ? l : null
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const { id } = await params
    if (!(await ownedListing(id, session.user.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    const { images, categoryId, ...rest } = parsed.data

    if (categoryId) {
      const cat = await prisma.marketplaceCategory.findFirst({ where: { id: categoryId, isActive: true }, select: { id: true } })
      if (!cat) return NextResponse.json({ error: "Categoría inválida" }, { status: 400 })
    }

    await prisma.marketplaceListing.update({
      where: { id },
      data: {
        ...rest,
        ...(categoryId ? { categoryId } : {}),
        // Si vienen imágenes, se reemplazan todas (borra las anteriores y crea las nuevas).
        ...(images
          ? { images: { deleteMany: {}, createMany: { data: images.map((img, i) => ({ url: img.url, sortOrder: img.sortOrder ?? i })) } } }
          : {}),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[MARKETPLACE_UPDATE]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al actualizar la publicación" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    const { id } = await params
    if (!(await ownedListing(id, session.user.id))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Soft-delete (las vistas públicas ya filtran deletedAt).
    await prisma.marketplaceListing.update({
      where: { id },
      data: { deletedAt: new Date(), status: "DELETED" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[MARKETPLACE_DELETE]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar la publicación" }, { status: 500 })
  }
}
