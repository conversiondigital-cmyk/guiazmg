import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })
  }

  try {
    const { businessId, businessName, businessUrl, googleMapsUrl, message } = await req.json()
    if (!businessName?.trim()) {
      return NextResponse.json({ error: "Nombre del negocio requerido" }, { status: 400 })
    }

    await prisma.profileClaimRequest.create({
      data: {
        userId: session.user.id,
        businessId: businessId || null,
        businessName: businessName.trim(),
        businessUrl: businessUrl || null,
        googleMapsUrl: googleMapsUrl || null,
        message: message || null,
        status: "PENDING",
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[CLAIM_BUSINESS]", error)
    return NextResponse.json({ error: "Error al enviar solicitud" }, { status: 500 })
  }
}

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const claims = await prisma.profileClaimRequest.findMany({
    include: { user: { select: { id: true, name: true, email: true } }, profile: { select: { id: true, name: true, slug: true } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(claims)
}
