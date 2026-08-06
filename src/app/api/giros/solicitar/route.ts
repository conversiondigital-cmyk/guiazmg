import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { sendEmail, getAdminNotifyEmail } from "@/lib/email"
import { createNotification } from "@/lib/notifications/create"
import { getPublicAppUrl } from "@/lib/env"
import { enforceRateLimits } from "@/lib/security/request-rate-limit"
import { getTrustedClientIp } from "@/lib/security/rate-limit"

export const dynamic = "force-dynamic"

const schema = z.object({
  name: z.string().trim().min(2, "Escribe el giro").max(120),
  categoryHint: z.string().trim().max(120).optional().or(z.literal("")),
  businessName: z.string().trim().max(180).optional().or(z.literal("")),
  note: z.string().trim().max(600).optional().or(z.literal("")),
})

// Solicitud de un giro que no está en el catálogo. Guarda el registro, avisa a los
// admins por correo (plantilla giro_suggested) y por notificación in-app para que
// lo revisen y lo agreguen si procede. Requiere sesión y está rate-limitada.
export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Inicia sesión para solicitar un giro" }, { status: 401 })
    }

    const ip = getTrustedClientIp(req)
    const limited = await enforceRateLimits([
      { key: `giro:suggest:user:${session.user.id}`, windowMs: 60_000, maxRequests: 5 },
      { key: `giro:suggest:ip:${ip}`, windowMs: 60_000, maxRequests: 10 },
    ])
    if (limited) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo." },
        { status: 429 },
      )
    }

    const parsed = schema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
    }
    const name = parsed.data.name
    const categoryHint = parsed.data.categoryHint || null
    const businessName = parsed.data.businessName || null
    const note = parsed.data.note || null
    const contactEmail = session.user.email ?? null

    await prisma.giroSuggestion.create({
      data: { name, categoryHint, businessName, note, contactEmail, userId: session.user.id },
    })

    // Aviso a los admins (in-app + correo). Fire-and-forget: no debe romper la
    // respuesta al usuario si el correo/notificación falla.
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", isActive: true, deletedAt: null },
      select: { id: true, email: true },
    })
    const reviewUrl = `${getPublicAppUrl()}/admin/giros-solicitudes`
    // Notificación in-app: a cada admin (la ven al entrar al panel).
    // Correo: UNA sola vez al buzón de contacto (contacto@), no al correo de login
    // de cada admin. admin@ es solo para el panel; contacto@ recibe el correo.
    const notifyEmail = await getAdminNotifyEmail()
    await Promise.allSettled([
      ...admins.map((a) =>
        createNotification({
          userId: a.id,
          type: "SYSTEM",
          title: "Nuevo giro solicitado",
          message: `"${name}" — un usuario no encontró su giro en el catálogo.`,
        }),
      ),
      sendEmail(
        notifyEmail,
        "giro_suggested",
        {
          giro: name,
          categoryHint: categoryHint ?? "",
          businessName: businessName ?? "",
          note: note ?? "",
          contactEmail: contactEmail ?? "",
          reviewUrl,
        },
      ),
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[GIRO_SUGGEST]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "No se pudo enviar la solicitud" }, { status: 500 })
  }
}
