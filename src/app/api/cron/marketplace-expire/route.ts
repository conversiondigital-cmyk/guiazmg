import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"
export const maxDuration = 60

// Expira las publicaciones de marketplace vencidas: pasa a EXPIRED las que están
// ACTIVE y cuya fecha de expiración (expiresAt) ya pasó. Marketplace es temporal;
// el dueño puede renovar para volver a activarlas. Autorizado por el secret de
// cron (Authorization) o una sesión ADMIN (para dispararlo a mano).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  const authHeader = req.headers.get("authorization")
  let allowed = !!secret && authHeader === `Bearer ${secret}`
  if (!allowed) {
    const session = await auth()
    if (session?.user?.role === "ADMIN") allowed = true
  }
  if (!allowed) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const result = await prisma.marketplaceListing.updateMany({
    where: { status: "ACTIVE", expiresAt: { not: null, lt: new Date() }, deletedAt: null },
    data: { status: "EXPIRED" },
  })

  return NextResponse.json({ expired: result.count })
}
