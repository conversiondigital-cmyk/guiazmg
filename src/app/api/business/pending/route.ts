import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { requireConsent } from "@/lib/auth/consent"
import { prisma } from "@/lib/prisma"
import { businessSchema } from "@/lib/validations"
import { slugify } from "@/lib/utils"
import { getPlanBySlug } from "@/lib/constants"

// Guarda temporalmente el alta de un negocio (cliente real, SIN cupón) mientras se
// paga. NO crea el negocio: solo persiste los datos validados en pending_registrations.
// El webhook de Stripe crea el negocio al confirmarse el pago. Valida por adelantado
// (uno por usuario, nombre único, plan válido) para no cobrar y luego fallar.
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
    const consent = await requireConsent()
    if (!consent.ok) return NextResponse.json({ error: consent.error }, { status: consent.status })

    const raw = await request.json().catch(() => ({}))
    const plan = typeof raw?.plan === "string" ? raw.plan : ""
    if (!getPlanBySlug(plan)) {
      return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
    }

    // Un negocio por usuario.
    const owned = await prisma.profile.findFirst({
      where: { ownerId: session.user.id, deletedAt: null },
      select: { id: true },
    })
    if (owned) {
      return NextResponse.json(
        { error: "Ya tienes un negocio registrado. Solo se permite uno por cuenta." },
        { status: 409 },
      )
    }

    const validation = businessSchema.safeParse(raw)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 },
      )
    }
    const data = validation.data

    // Nombre único (mismo criterio que el alta directa).
    const nameSlug = slugify(data.name)
    const dupName = await prisma.profile.findFirst({
      where: { slug: { equals: nameSlug }, deletedAt: null },
      select: { id: true },
    })
    if (dupName) {
      return NextResponse.json(
        { error: "Ya existe un negocio con ese nombre. Si es una sucursal, contáctanos.", code: "DUPLICATE_NAME" },
        { status: 409 },
      )
    }

    // Limpia intentos previos del mismo usuario (evita acumular temporales).
    await prisma.pendingRegistration.deleteMany({ where: { userId: session.user.id } })

    const pending = await prisma.pendingRegistration.create({
      data: { userId: session.user.id, planSlug: plan, data: data as any },
    })

    return NextResponse.json({ id: pending.id, plan }, { status: 201 })
  } catch (error) {
    console.error("[BUSINESS_PENDING]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "No se pudo procesar el registro" }, { status: 500 })
  }
}
