import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { id } = await params
  try {
    const db = prisma as any
    const { status, businessId } = await req.json()
    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 })
    }

    if (status === "APPROVED") {
      if (!businessId) {
        return NextResponse.json({ error: "Business ID requerido" }, { status: 400 })
      }

      const claim = await db.businessClaimRequest.findUnique({
        where: { id },
        select: { businessId: true, userId: true },
      })
      if (!claim) return NextResponse.json({ error: "Solicitud no encontrada" }, { status: 404 })
      if (!claim.businessId || claim.businessId !== businessId) {
        return NextResponse.json({ error: "El negocio no coincide con la solicitud" }, { status: 400 })
      }

      await db.$transaction(async (tx: any) => {
        await tx.business.update({
          where: { id: businessId },
          data: { ownerId: claim.userId },
        })

        await tx.businessClaimRequest.update({
          where: { id },
          data: { status },
        })
      })

      return NextResponse.json({ success: true })
    }

      await db.businessClaimRequest.update({
      where: { id },
      data: { status },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[REVIEW_CLAIM]", error)
    return NextResponse.json({ error: "Error al revisar solicitud" }, { status: 500 })
  }
}
