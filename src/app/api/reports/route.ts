import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  type: z.enum(["marketplace", "business", "listing"]).optional(),
  id: z.string().optional(),
  reason: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
})

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Debes iniciar sesión para reportar" }, { status: 401 })
  }

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }
  const { type, id, reason, description } = parsed.data

  // El modelo Report enlaza a Profile (businessId) o Listing (listingId).
  // Para marketplace u otros tipos sin relación propia, el contexto se guarda
  // en la descripción para que el admin sepa qué se reportó.
  const data: {
    reporterUserId: string
    reason: string
    description: string | null
    status: "PENDING"
    businessId?: string
    listingId?: string
  } = {
    reporterUserId: session.user.id,
    reason,
    description: description ?? null,
    status: "PENDING",
  }

  if (type === "business" && id) {
    data.businessId = id
  } else if (type === "listing" && id) {
    data.listingId = id
  } else if (id) {
    data.description = `[${type ?? "ref"}:${id}] ${description ?? ""}`.trim()
  }

  try {
    await prisma.report.create({ data })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[reports] create failed:", error)
    return NextResponse.json({ error: "Error al enviar el reporte" }, { status: 500 })
  }
}
