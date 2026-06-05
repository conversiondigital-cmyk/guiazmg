import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { sellerId, listingId, rating, comment } = body

  if (!sellerId || !listingId || !rating) {
    return NextResponse.json({ error: "sellerId, listingId y rating son requeridos" }, { status: 400 })
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating debe ser entre 1 y 5" }, { status: 400 })
  }

  if (sellerId === session.user.id) {
    return NextResponse.json({ error: "No puedes calificarte a ti mismo" }, { status: 400 })
  }

  const listing = await prisma.marketplaceListing.findFirst({
    where: { id: listingId, userId: sellerId, deletedAt: null, status: "ACTIVE" },
    select: { id: true },
  })

  if (!listing) {
    return NextResponse.json({ error: "La publicación no corresponde al vendedor" }, { status: 400 })
  }

  const existing = await prisma.sellerReview.findUnique({
    where: { sellerId_reviewerId_listingId: { sellerId, reviewerId: session.user.id, listingId } },
  })
  if (existing) {
    return NextResponse.json({ error: "Ya calificaste esta publicación" }, { status: 409 })
  }

  const review = await prisma.sellerReview.create({
    data: {
      sellerId,
      listingId,
      reviewerId: session.user.id,
      rating,
      comment: comment || null,
    },
  })

  return NextResponse.json(review, { status: 201 })
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const sellerId = searchParams.get("sellerId")

  if (!sellerId) {
    return NextResponse.json({ error: "sellerId requerido" }, { status: 400 })
  }

  const reviews = await prisma.sellerReview.findMany({
    where: { sellerId },
    include: {
      reviewer: { select: { id: true, name: true, image: true } },
      listing: { select: { id: true, title: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  const stats = await prisma.sellerReview.aggregate({
    where: { sellerId },
    _avg: { rating: true },
    _count: true,
  })

  return NextResponse.json({ reviews, stats })
}
