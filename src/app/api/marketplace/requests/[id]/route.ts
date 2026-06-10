import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const body = await req.json()
  const { message } = body
  if (!message) {
    return NextResponse.json({ error: "Mensaje requerido" }, { status: 400 })
  }

  const request = await prisma.serviceRequest.findUnique({ where: { id } })
  if (!request) {
    return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
  }

  const isAdmin = session.user.role === "ADMIN"
  const isEditor = session.user.role === "EDITOR"
  const business = await prisma.profile.findFirst({
    where: { ownerId: session.user.id, deletedAt: null },
    select: { id: true },
  })

  if (!isAdmin && !isEditor && !business) {
    return NextResponse.json({ error: "Debes tener un negocio para responder" }, { status: 403 })
  }

  const response = await prisma.serviceRequestResponse.create({
    data: {
      message,
      requestId: id,
      userId: session.user.id,
      isBusiness: !!business || isAdmin || isEditor,
    },
  })

  return NextResponse.json(response, { status: 201 })
}
