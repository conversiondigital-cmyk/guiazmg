import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getStripe } from "@/lib/stripe"
import { getPublicAppUrl } from "@/lib/env"

export const dynamic = "force-dynamic"

// Portal de facturación de Stripe: el dueño administra/cancela su suscripción y
// actualiza su tarjeta. Requiere que el negocio tenga un cliente de Stripe guardado
// (se guarda al contratar por suscripción). La cancelación efectiva la sincroniza el
// webhook (customer.subscription.updated/deleted).
export async function POST() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const business = await prisma.profile.findFirst({
    where: { ownerId: session.user.id, deletedAt: null },
    select: { id: true },
  })
  if (!business) {
    return NextResponse.json({ error: "No tienes un negocio registrado" }, { status: 404 })
  }

  const membership = await prisma.profileMembership.findUnique({
    where: { businessId: business.id },
    select: { providerCustomerId: true },
  })
  if (!membership?.providerCustomerId) {
    return NextResponse.json(
      { error: "No tienes una suscripción de pago para administrar. (Los planes de prueba por cupón no se cobran.)" },
      { status: 400 }
    )
  }

  const stripe = await getStripe()
  if (!stripe) {
    return NextResponse.json({ error: "Stripe no está configurado." }, { status: 400 })
  }

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: membership.providerCustomerId,
      return_url: `${getPublicAppUrl()}/dashboard/membresia`,
    })
    return NextResponse.json({ url: portal.url })
  } catch (e) {
    console.error("[STRIPE_PORTAL]", e instanceof Error ? e.message : e)
    return NextResponse.json(
      { error: "No se pudo abrir el portal de facturación. Inténtalo más tarde." },
      { status: 500 }
    )
  }
}
