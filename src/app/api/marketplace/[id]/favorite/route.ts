import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Guardar/favorito de una publicación: /api/marketplace/{id}/favorite.
// Va anidado bajo [id] (no como hermano estático) para no colisionar con la ruta
// dinámica [id]/route.ts.

async function notifySeller(userId: string, title: string, message: string, link: string) {
  try {
    await (prisma as any).notification.create({
      data: { userId, title, message, link, type: "SYSTEM", isRead: false },
    })
  } catch {
    /* no crítico */
  }
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ favorited: false, authed: false })
  const fav = await prisma.favorite
    .findUnique({
      where: { userId_marketplaceListingId: { userId: session.user.id, marketplaceListingId: id } },
      select: { id: true },
    })
    .catch(() => null)
  return NextResponse.json({ favorited: !!fav, authed: true })
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Inicia sesión para guardar publicaciones" }, { status: 401 })
  }
  const userId = session.user.id

  const existing = await prisma.favorite.findUnique({
    where: { userId_marketplaceListingId: { userId, marketplaceListingId: id } },
    select: { id: true },
  })

  if (!existing) {
    await prisma.favorite.create({ data: { userId, marketplaceListingId: id } })
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id },
      select: { userId: true, title: true, slug: true, category: { select: { slug: true } } },
    })
    if (listing && listing.userId !== userId) {
      void notifySeller(
        listing.userId,
        "Guardaron tu publicación",
        `A alguien le interesó "${listing.title}".`,
        `/marketplace/${listing.category.slug}/${listing.slug}`,
      )
    }
  }
  return NextResponse.json({ favorited: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  await prisma.favorite.deleteMany({ where: { userId: session.user.id, marketplaceListingId: id } })
  return NextResponse.json({ favorited: false })
}
