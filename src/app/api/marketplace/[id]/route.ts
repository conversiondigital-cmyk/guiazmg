export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getSettingNumber } from "@/lib/settings"
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
  // Acción de estado que el dueño puede aplicar a su publicación temporal.
  statusAction: z.enum(["SOLD", "PAUSE", "ACTIVATE", "RENEW"]).optional(),
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
    const { images, categoryId, statusAction, ...rest } = parsed.data

    if (categoryId) {
      const cat = await prisma.marketplaceCategory.findFirst({ where: { id: categoryId, isActive: true }, select: { id: true } })
      if (!cat) return NextResponse.json({ error: "Categoría inválida" }, { status: 400 })
    }

    // Acciones de estado del dueño: vender, pausar, reactivar o renovar (renovar
    // y reactivar refrescan la ventana de expiración configurable).
    let statusData: { status?: "SOLD" | "HIDDEN" | "ACTIVE"; expiresAt?: Date } = {}
    if (statusAction) {
      // Reactivar/renovar deja la publicación ACTIVE: revalida el tope de activas
      // para que no se evada reactivando vendidas/expiradas.
      if (statusAction === "ACTIVATE" || statusAction === "RENEW") {
        const max = await getSettingNumber("marketplace_max_active_listings", 3)
        const others = await prisma.marketplaceListing.count({
          where: {
            userId: session.user.id,
            id: { not: id },
            deletedAt: null,
            status: { in: ["PENDING", "ACTIVE", "HIDDEN"] },
          },
        })
        if (others >= max) {
          return NextResponse.json(
            { error: `Alcanzaste el máximo de ${max} publicaciones activas. Marca alguna como vendida o elimínala antes de reactivar esta.`, code: "MAX_ACTIVE_LISTINGS" },
            { status: 409 }
          )
        }
      }
      const ttlDays = await getSettingNumber("marketplace_listing_ttl_days", 30)
      const fresh = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000)
      if (statusAction === "SOLD") statusData = { status: "SOLD" }
      else if (statusAction === "PAUSE") statusData = { status: "HIDDEN" }
      else statusData = { status: "ACTIVE", expiresAt: fresh } // ACTIVATE | RENEW
    }

    await prisma.marketplaceListing.update({
      where: { id },
      data: {
        ...rest,
        ...statusData,
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
