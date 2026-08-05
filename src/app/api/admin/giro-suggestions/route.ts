export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const schema = z.object({
  id: z.string().min(1),
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]),
})

// Admin: cambia el estado de una solicitud de giro (revisada/aprobada/rechazada).
export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  await prisma.giroSuggestion.update({
    where: { id: parsed.data.id },
    data: { status: parsed.data.status },
  })

  await prisma.auditLog
    .create({
      data: {
        actorUserId: session.user.id,
        action: "update",
        entityType: "GiroSuggestion",
        entityId: parsed.data.id,
        newValue: JSON.stringify({ status: parsed.data.status }),
      },
    })
    .catch(() => {})

  return NextResponse.json({ success: true })
}
