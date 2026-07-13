export const dynamic = "force-dynamic"

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const schema = z.object({
  name: z.string().trim().min(2, "El nombre es muy corto").max(80, "El nombre es muy largo"),
})

// Cualquier usuario autenticado edita SU propio nombre. El correo no se cambia
// por aquí (es la identidad de la cuenta / login).
export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const parsed = schema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Nombre inválido" }, { status: 400 })
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: parsed.data.name },
    })

    return NextResponse.json({ success: true, name: parsed.data.name })
  } catch (error) {
    console.error("[USER_PROFILE_UPDATE]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al guardar" }, { status: 500 })
  }
}
