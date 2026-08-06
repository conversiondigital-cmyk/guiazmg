import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Estado del favorito para el usuario actual (false si no hay sesión).
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId")
  if (!businessId) return NextResponse.json({ favorited: false, authed: false })
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ favorited: false, authed: false })
  const fav = await prisma.favorite
    .findUnique({
      where: { userId_businessId: { userId: session.user.id, businessId } },
      select: { id: true },
    })
    .catch(() => null)
  return NextResponse.json({ favorited: !!fav, authed: true })
}

// Guarda el negocio en favoritos (idempotente).
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Inicia sesión para guardar favoritos" }, { status: 401 })
  const { businessId } = await req.json().catch(() => ({}))
  if (!businessId || typeof businessId !== "string") {
    return NextResponse.json({ error: "Falta el negocio" }, { status: 400 })
  }
  await prisma.favorite.upsert({
    where: { userId_businessId: { userId: session.user.id, businessId } },
    create: { userId: session.user.id, businessId },
    update: {},
  })
  return NextResponse.json({ favorited: true })
}

// Quita el negocio de favoritos.
export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { businessId } = await req.json().catch(() => ({}))
  if (!businessId || typeof businessId !== "string") {
    return NextResponse.json({ error: "Falta el negocio" }, { status: 400 })
  }
  await prisma.favorite.deleteMany({ where: { userId: session.user.id, businessId } })
  return NextResponse.json({ favorited: false })
}
