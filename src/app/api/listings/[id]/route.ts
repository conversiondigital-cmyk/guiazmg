export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const blankToNull = (v: unknown) => (v === "" || v === undefined ? null : v)
const imageUrl = z.string().trim().max(1000).refine(
  (v) => /^https?:\/\//.test(v) || v.startsWith("/"),
  "URL de imagen inválida"
)

const updateSchema = z.object({
  title: z.string().trim().min(2).max(180).optional(),
  description: z.preprocess(blankToNull, z.string().trim().max(3000).nullable().optional()),
  price: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : v),
    z.coerce.number().min(0).max(9999999).nullable().optional()
  ),
  subcategoryId: z.preprocess(blankToNull, z.string().nullable().optional()),
  images: z.array(imageUrl).max(10).optional(),
  // Activar / pausar (ARCHIVED = oculto del perfil público, recuperable).
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
})

// Carga el producto SOLO si es del negocio del usuario en sesión. Devuelve null
// si no existe o no le pertenece (no se distingue, para no filtrar existencia).
async function loadOwned(id: string, userId: string) {
  const listing = await prisma.listing.findFirst({
    where: { id, deletedAt: null },
    select: {
      id: true,
      categoryId: true,
      profile: { select: { ownerId: true, slug: true } },
    },
  })
  if (!listing || listing.profile.ownerId !== userId) return null
  return listing
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const { id } = await params
    const listing = await loadOwned(id, session.user.id)
    if (!listing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    const parsed = updateSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
    }
    const { title, description, price, subcategoryId, images, status } = parsed.data

    if (subcategoryId) {
      const sub = await prisma.subcategory.findFirst({
        where: { id: subcategoryId, isActive: true, categoryId: listing.categoryId },
        select: { id: true },
      })
      if (!sub) return NextResponse.json({ error: "Subcategoría inválida" }, { status: 400 })
    }

    await prisma.listing.update({
      where: { id: listing.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(price !== undefined ? { price } : {}),
        ...(subcategoryId !== undefined ? { subcategoryId } : {}),
        ...(status !== undefined ? { status } : {}),
        // La galería se reemplaza completa, en el orden recibido.
        ...(images
          ? {
              images: {
                deleteMany: {},
                createMany: { data: images.map((url, i) => ({ imageUrl: url, sortOrder: i })) },
              },
            }
          : {}),
      },
    })

    revalidatePath(`/perfil/${listing.profile.slug}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[LISTING_UPDATE]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al actualizar el producto" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const { id } = await params
    const listing = await loadOwned(id, session.user.id)
    if (!listing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 })
    }

    await prisma.listing.update({
      where: { id: listing.id },
      data: { deletedAt: new Date(), status: "ARCHIVED" },
    })

    revalidatePath(`/perfil/${listing.profile.slug}`)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[LISTING_DELETE]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al eliminar el producto" }, { status: 500 })
  }
}
