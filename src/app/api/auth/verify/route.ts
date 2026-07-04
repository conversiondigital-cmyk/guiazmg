import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { consumeVerificationToken } from "@/lib/auth/verification"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Enlace de activación que se abre desde el correo. Marca el correo como
// verificado y redirige al login con un aviso de éxito/fracaso.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") || ""
  const email = await consumeVerificationToken(token)

  if (!email) {
    return NextResponse.redirect(new URL("/auth/login?verify_error=1", req.url))
  }

  await prisma.user.updateMany({
    where: { email, emailVerified: null },
    data: { emailVerified: new Date() },
  })

  return NextResponse.redirect(new URL("/auth/login?verified=1", req.url))
}
