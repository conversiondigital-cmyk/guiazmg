export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { consumeEmailChangeToken } from "@/lib/auth/email-change"

// Enlace que se abre desde el correo NUEVO. Aplica el cambio de correo (marcándolo
// verificado) y redirige a la configuración con un aviso. Revalida la unicidad por
// si el correo se ocupó dentro de la ventana de 24h.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || ""
  const payload = await consumeEmailChangeToken(token)

  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/cuenta/configuracion?email_error=${reason}`, req.url))

  if (!payload) return fail("token")

  const { userId, newEmail } = payload

  // Revalida unicidad: alguien pudo tomar ese correo en la ventana del token.
  const taken = await prisma.user.findUnique({ where: { email: newEmail }, select: { id: true } })
  if (taken && taken.id !== userId) return fail("taken")

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { email: newEmail, emailVerified: new Date() },
    })
  } catch (e) {
    // P2002: carrera por el índice único del correo.
    if (typeof e === "object" && e !== null && "code" in e && (e as { code?: unknown }).code === "P2002") {
      return fail("taken")
    }
    console.error("[EMAIL_CHANGE_VERIFY]", e instanceof Error ? e.message : e)
    return fail("server")
  }

  return NextResponse.redirect(new URL("/cuenta/configuracion?email_changed=1", req.url))
}
