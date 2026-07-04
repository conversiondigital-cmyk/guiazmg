import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { MEMBERSHIP_PLANS } from "@/lib/constants"
import { getPublicAppUrl } from "@/lib/env"

// Crea una sesión de Stripe Checkout para una membresía. Espeja el flujo de
// Mercado Pago (mismo external_reference) pero con Stripe. Credential-ready:
// si no hay stripe_api_key, responde 400 "no configurado".
export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { plan, businessId } = (await request.json().catch(() => ({}))) as {
    plan?: string
    businessId?: string
  }

  const planDef = plan ? MEMBERSHIP_PLANS[plan as keyof typeof MEMBERSHIP_PLANS] : undefined
  if (!planDef) {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
  }
  if (!businessId) {
    return NextResponse.json({ error: "Falta el negocio" }, { status: 400 })
  }
  if (planDef.price <= 0) {
    return NextResponse.json({ error: "El plan gratuito no requiere pago" }, { status: 400 })
  }

  // El negocio debe ser del usuario.
  const business = await prisma.profile.findFirst({
    where: { id: businessId, ownerId: session.user.id },
    select: { id: true },
  })
  if (!business) {
    return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 })
  }

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe no está configurado (Admin → Configuración → Pagos)." },
      { status: 400 }
    )
  }

  const baseUrl = getPublicAppUrl()
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "mxn",
          unit_amount: Math.round(planDef.price * 100),
          product_data: { name: `Membresía ${planDef.name} · Guía ZMG` },
        },
      },
    ],
    metadata: {
      externalReference: `membership:${plan}:${session.user.id}:${businessId}`,
    },
    success_url: `${baseUrl}/dashboard?pago=exitoso`,
    cancel_url: `${baseUrl}/planes?pago=cancelado`,
  })

  return NextResponse.json({ url: checkout.url })
}
