import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { getPlanBySlug } from "@/lib/constants"
import { getPublicAppUrl } from "@/lib/env"

// Crea una sesión de Stripe Checkout en modo SUSCRIPCIÓN (cobro recurrente mensual)
// para una membresía. El webhook activa/renueva. Credential-ready: si no hay
// stripe_api_key, responde 400 "no configurado".
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { plan, businessId, pending } = (await request.json().catch(() => ({}))) as {
    plan?: string
    businessId?: string
    pending?: string
  }

  const planDef = getPlanBySlug(plan)
  if (!planDef) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
  }
  if (!businessId && !pending) {
    return NextResponse.json({ error: "Falta el negocio" }, { status: 400 })
  }
  if (planDef.price <= 0) {
    return NextResponse.json({ error: "El plan gratuito no requiere pago" }, { status: 400 })
  }

  // Dos modos: negocio YA creado (businessId) o alta en espera de pago (pending).
  // En ambos se valida propiedad y se arma el externalReference que leerá el webhook.
  let externalReference: string
  if (pending) {
    const pend = await prisma.pendingRegistration.findUnique({
      where: { id: pending },
      select: { userId: true },
    })
    if (!pend || pend.userId !== session.user.id) {
      return NextResponse.json({ error: "Registro no encontrado" }, { status: 404 })
    }
    externalReference = `pendingmembership:${plan}:${session.user.id}:${pending}`
  } else {
    const business = await prisma.profile.findFirst({
      where: { id: businessId, ownerId: session.user.id },
      select: { id: true },
    })
    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
    }
    externalReference = `membership:${plan}:${session.user.id}:${businessId}`
  }

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe no está configurado (Admin → Configuración → Pagos)." },
      { status: 400 }
    )
  }

  // Correo del usuario: asocia el cliente de Stripe (necesario para el portal de
  // cancelación y para ligar la suscripción a la persona).
  const dbUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { email: true } })

  const baseUrl = getPublicAppUrl()
  // SUSCRIPCIÓN recurrente: Stripe cobra el plan cada mes automáticamente hasta que
  // el dueño cancele desde el portal. El webhook activa el alta y cada renovación
  // (invoice.paid) extiende el periodo.
  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: dbUser?.email ?? undefined,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "mxn",
          unit_amount: Math.round(planDef.price * 100),
          recurring: { interval: "month" },
          product_data: { name: `Membresía ${planDef.name} · Guía ZMG` },
        },
      },
    ],
    // El externalReference viaja en la sesión Y en la suscripción, para que tanto el
    // alta inicial como las renovaciones sepan a qué negocio corresponden.
    metadata: { externalReference },
    subscription_data: { metadata: { externalReference } },
    success_url: `${baseUrl}/dashboard?pago=exitoso`,
    cancel_url: `${baseUrl}/planes?pago=cancelado`,
  })

  return NextResponse.json({ url: checkout.url })
}
