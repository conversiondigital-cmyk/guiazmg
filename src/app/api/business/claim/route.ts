import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { businessId, message } = await req.json()
  if (!businessId) {
    return NextResponse.json({ error: "ID de negocio requerido" }, { status: 400 })
  }

  const business = await prisma.profile.findUnique({ where: { id: businessId } })
  if (!business) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
  }

  if (business.ownerId === session.user.id) {
    return NextResponse.json({ error: "Ya eres el dueño de este negocio" }, { status: 400 })
  }

  const existingClaim = await prisma.profileClaimRequest.findFirst({
    where: { userId: session.user.id, businessName: business.name, status: "PENDING" },
  })
  if (existingClaim) {
    return NextResponse.json({ error: "Ya tienes una solicitud pendiente para este negocio" }, { status: 409 })
  }

  const claim = await prisma.profileClaimRequest.create({
    data: {
      userId: session.user.id,
      businessName: business.name,
      businessUrl: business.slug,
      message: message || null,
    },
  })

  return NextResponse.json(claim, { status: 201 })
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const claims = await prisma.profileClaimRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(claims)
}
