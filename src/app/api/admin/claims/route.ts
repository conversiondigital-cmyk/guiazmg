import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const claims = await prisma.profileClaimRequest.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
      profile: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(claims)
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { claimId, status } = await req.json()

  if (!claimId || !["APPROVED", "REJECTED", "PENDING"].includes(status)) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const claim = await prisma.profileClaimRequest.findUnique({
    where: { id: claimId },
  })
  if (!claim) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }

  if (status === "APPROVED") {
    const business = await prisma.profile.findFirst({
      where: { name: claim.businessName, slug: claim.businessUrl ?? undefined },
    })
    if (business) {
      await prisma.profile.update({
        where: { id: business.id },
        data: { ownerId: claim.userId },
      })
    }
  }

  const updated = await prisma.profileClaimRequest.update({
    where: { id: claimId },
    data: { status },
  })

  return NextResponse.json(updated)
}
