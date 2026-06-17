import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getVerificationMode } from "@/lib/verification-config"
import { createNotification } from "@/lib/notifications/create"

// El dueño solicita la verificación de su negocio (solo en modo manual).
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const mode = await getVerificationMode()
  if (mode !== "manual") {
    return NextResponse.json({ error: "Las solicitudes de verificación no están habilitadas." }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const businessId = String(body?.businessId || "")
  if (!businessId) return NextResponse.json({ error: "businessId requerido" }, { status: 400 })

  const business = await prisma.profile.findFirst({
    where: { id: businessId, ownerId: session.user.id, deletedAt: null },
    select: { id: true, name: true, verificationStatus: true, isVerified: true },
  })
  if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
  if (business.isVerified || business.verificationStatus === "VERIFIED") {
    return NextResponse.json({ error: "Tu negocio ya está verificado." }, { status: 400 })
  }
  if (business.verificationStatus === "PENDING") {
    return NextResponse.json({ error: "Ya tienes una solicitud pendiente." }, { status: 400 })
  }

  const updated = await prisma.profile.update({
    where: { id: businessId },
    data: { verificationStatus: "PENDING" },
    select: { verificationStatus: true },
  })

  // Avisa a los administradores que hay una solicitud nueva en la cola.
  try {
    const admins = await prisma.user.findMany({ where: { role: "ADMIN", isActive: true }, select: { id: true } })
    await Promise.all(
      admins.map((a) =>
        createNotification({
          userId: a.id,
          type: "SYSTEM",
          title: "Nueva solicitud de verificación",
          message: `${business.name} solicitó verificación.`,
        })
      )
    )
  } catch {}

  return NextResponse.json({ verificationStatus: updated.verificationStatus })
}
