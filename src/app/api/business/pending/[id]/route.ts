import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Devuelve el resumen del alta pendiente (para mostrarlo en el checkout). Solo el
// dueño del registro puede verlo. No expone datos de otros usuarios.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }
  const { id } = await ctx.params
  const p = await prisma.pendingRegistration.findUnique({ where: { id } })
  if (!p || p.userId !== session.user.id) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 })
  }
  const d = (p.data ?? {}) as Record<string, any>
  return NextResponse.json({
    plan: p.planSlug,
    name: d.name ?? "",
    profileType: d.profileType ?? null,
    addressText: d.addressText ?? "",
    phone: d.phone ?? "",
    whatsapp: d.whatsapp ?? "",
    email: d.email ?? "",
  })
}
