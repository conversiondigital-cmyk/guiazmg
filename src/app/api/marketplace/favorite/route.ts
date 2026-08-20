import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Notifica al vendedor (fire-and-forget; nunca rompe la petición).
async function notifySeller(userId: string, title: string, message: string, link: string) {
  try {
    await (prisma as any).notification.create({
      data: { userId, title, message, link, type: "SYSTEM", isRead: false },
    })
  } catch {
    /* no crítico */
  }
}

// Estado del guardado para el usuario actual.
export async function GET(req: NextRequest) {
  const listingId = req.nextUrl.searchParams.get("listingId")
  if (!listingId) return NextResponse.json({ favorited: false, authed: false })
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ favorited: false, authed: false })
  const fav = await prisma.favorite
    .findUnique({
      where: { userId_marketplaceListingId: { userId: session.user.id, marketplaceListingId: listingId } },
      select: { id: true },
    })
    .catch(() => null)
  return NextResponse.json({ favorited: !!fav, authed: true })
}

// Guarda la publicación. Al guardarla POR PRIMERA VEZ, avisa al vendedor.
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Inicia sesión para guardar publicaciones" }, { status: 401 })
  }
  const userId = session.user.id
  const { listingId } = await req.json().catch(() => ({}))
  if (!listingId || typeof listingId !== "string") {
    return NextResponse.json({ error: "Falta la publicación" }, { status: 400 })
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_marketplaceListingId: { userId, marketplaceListingId: listingId } },
    select: { id: true },
  })

  if (!existing) {
    await prisma.favorite.create({ data: { userId, marketplaceListingId: listingId } })
    // Aviso al vendedor (solo si no se guarda a sí mismo).
    const listing = await prisma.marketplaceListing.findUnique({
      where: { id: listingId },
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

// Quita el guardado.
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { listingId } = await req.json().catch(() => ({}))
  if (!listingId || typeof listingId !== "string") {
    return NextResponse.json({ error: "Falta la publicación" }, { status: 400 })
  }
  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, marketplaceListingId: listingId },
  })
  return NextResponse.json({ favorited: false })
}
