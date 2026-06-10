import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { apiLimiter } from "@/lib/security/rate-limit"

const schema = z.object({ email: z.string().email() })

export async function POST(req: Request) {
  const rl = await apiLimiter(req)
  if (!rl.success) {
    return NextResponse.json(
      { error: "Demasiadas solicitudes. Intenta más tarde." },
      { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil((rl.resetTime - Date.now()) / 1000))) } }
    )
  }

  try {
    const parsed = schema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json({ error: "Correo electrónico inválido" }, { status: 400 })
    }
    const email = parsed.data.email.toLowerCase().trim()

    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { isActive: true },
      create: { email, source: "footer" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[newsletter] subscribe failed:", error)
    return NextResponse.json({ error: "Error al procesar la suscripción" }, { status: 500 })
  }
}
