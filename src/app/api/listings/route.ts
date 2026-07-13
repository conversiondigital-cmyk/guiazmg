export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { slugify, generateUniqueSlug } from "@/lib/utils"
import { revalidatePath } from "next/cache"
import { z } from "zod"

const blankToNull = (v: unknown) => (v === "" || v === undefined ? null : v)
const imageUrl = z.string().trim().max(1000).refine(
  (v) => /^https?:\/\//.test(v) || v.startsWith("/"),
  "URL de imagen inválida"
)

// Producto del catálogo de un negocio (modelo Listing). A diferencia del
// marketplace (compraventa suelta), aquí el PRECIO ES OPCIONAL: mucha venta
// local es por kilo/manojo o "pregunta precio", y no hay mínimo de $20.
const productSchema = z.object({
  title: z.string().trim().min(2, "El nombre es muy corto").max(180),
  description: z.preprocess(blankToNull, z.string().trim().max(3000).nullable().optional()),
  price: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? null : v),
    z.coerce.number().min(0).max(9999999).nullable().optional()
  ),
  subcategoryId: z.preprocess(blankToNull, z.string().nullable().optional()),
  images: z.array(imageUrl).max(10).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const business = await prisma.profile.findFirst({
      where: { ownerId: session.user.id, deletedAt: null },
      select: { id: true, slug: true, categoryId: true },
    })
    if (!business) {
      return NextResponse.json({ error: "No tienes un negocio registrado" }, { status: 404 })
    }
    if (!business.categoryId) {
      return NextResponse.json(
        { error: "Tu negocio necesita una categoría antes de agregar productos" },
        { status: 400 }
      )
    }

    const parsed = productSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", details: parsed.error.flatten() }, { status: 400 })
    }
    const { title, description, price, subcategoryId, images } = parsed.data

    // La subcategoría (si viene) debe pertenecer a la categoría del negocio.
    if (subcategoryId) {
      const sub = await prisma.subcategory.findFirst({
        where: { id: subcategoryId, isActive: true, categoryId: business.categoryId },
        select: { id: true },
      })
      if (!sub) return NextResponse.json({ error: "Subcategoría inválida" }, { status: 400 })
    }

    // Límite de productos según el plan (maxListings). Sin membresía activa se usa
    // un tope generoso por defecto para no bloquear durante el lanzamiento.
    const membership = await prisma.profileMembership.findUnique({
      where: { businessId: business.id },
      select: { status: true, plan: { select: { maxListings: true } } },
    })
    const maxListings = membership?.status === "ACTIVE" ? membership.plan.maxListings ?? 100 : 100
    const listingCount = await prisma.listing.count({ where: { businessId: business.id, deletedAt: null } })
    if (listingCount >= maxListings) {
      return NextResponse.json(
        { error: `Alcanzaste el límite de ${maxListings} productos de tu plan. Mejora tu plan para agregar más.`, code: "MAX_LISTINGS" },
        { status: 409 }
      )
    }

    // Slug único DENTRO del negocio (el modelo tiene @@unique([businessId, slug])).
    const slug = await generateUniqueSlug(slugify(title), async (s) =>
      Boolean(
        await prisma.listing.findFirst({
          where: { businessId: business.id, slug: s },
          select: { id: true },
        })
      )
    )

    const listing = await prisma.listing.create({
      data: {
        businessId: business.id,
        categoryId: business.categoryId,
        subcategoryId: subcategoryId ?? null,
        title,
        slug,
        description: description ?? null,
        price: price ?? null,
        // El negocio ya pasó moderación; sus productos entran visibles de una vez.
        status: "ACTIVE",
        images: images?.length
          ? { createMany: { data: images.map((url, i) => ({ imageUrl: url, sortOrder: i })) } }
          : undefined,
      },
      select: { id: true },
    })

    revalidatePath(`/perfil/${business.slug}`)
    return NextResponse.json({ id: listing.id }, { status: 201 })
  } catch (error) {
    console.error("[LISTING_CREATE]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear el producto" }, { status: 500 })
  }
}
