import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildPreferencePayload, createPreference } from "@/lib/mercadopago"
import { getStripe } from "@/lib/stripe"
import { getPublicAppUrl } from "@/lib/env"
import { hasActiveBusinessBoost } from "@/lib/payments/fulfill"

async function assertBusinessOwnership(userId: string, businessId: string) {
  const business = await prisma.profile.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true, deletedAt: true },
  })
  return !!business && !business.deletedAt && business.ownerId === userId
}

async function assertListingOwnership(businessId: string, listingId: string) {
  const listing = await prisma.listing.findFirst({
    where: { id: listingId, businessId, deletedAt: null },
    select: { id: true },
  })
  return !!listing
}

// Crea el checkout para IMPULSAR (boost) un negocio o un producto de su catálogo,
// con el proveedor elegido (Stripe por defecto, o Mercado Pago). El fulfillment
// (crear el registro Boost + marcar isBoosted) lo hace el webhook correspondiente
// vía fulfillBusinessBoost, idempotente. externalReference:
//   boost:<boostDefId>:<businessId>:<userId>[:<listingId>]
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { boostDefinitionId, businessId, listingId, provider } = (await request.json().catch(() => ({}))) as {
      boostDefinitionId?: string
      businessId?: string
      listingId?: string | null
      provider?: string
    }

    if (!boostDefinitionId || !businessId) {
      return NextResponse.json({ error: "Datos de boost inválidos" }, { status: 400 })
    }

    const boostDef = await prisma.boostDefinition.findUnique({ where: { id: boostDefinitionId } })
    if (!boostDef || !boostDef.isActive) {
      return NextResponse.json({ error: "Tipo de boost inválido o inactivo" }, { status: 400 })
    }

    const allowed = await assertBusinessOwnership(session.user.id, businessId)
    if (!allowed) {
      return NextResponse.json({ error: "No autorizado para este negocio" }, { status: 403 })
    }

    if (listingId) {
      const listingAllowed = await assertListingOwnership(businessId, listingId)
      if (!listingAllowed) {
        return NextResponse.json({ error: "El producto no pertenece al negocio" }, { status: 403 })
      }
    }

    // Regla: solo 1 boost activo a la vez por negocio. Hay que esperar a que el
    // vigente termine antes de comprar otro.
    if (await hasActiveBusinessBoost(businessId)) {
      return NextResponse.json(
        { error: "Ya tienes un boost activo en este negocio. Espera a que termine para comprar otro." },
        { status: 409 }
      )
    }

    const ref = listingId
      ? `boost:${boostDefinitionId}:${businessId}:${session.user.id}:${listingId}`
      : `boost:${boostDefinitionId}:${businessId}:${session.user.id}`
    const baseUrl = getPublicAppUrl()
    const price = Number(boostDef.price)

    // Mercado Pago solo si se pide explícitamente; por defecto Stripe (lo configurado).
    if (provider === "MERCADO_PAGO") {
      const payload = buildPreferencePayload({
        title: `Boost ${boostDef.name} - Guía ZMG`,
        quantity: 1,
        unitPrice: price,
        externalReference: ref,
      })
      const response = await createPreference(payload)
      return NextResponse.json({ initPoint: response.init_point, paymentId: response.id })
    }

    const stripe = await getStripe()
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe no está configurado (Admin → Configuración → Pagos)." },
        { status: 400 }
      )
    }
    const checkout = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "mxn",
            unit_amount: Math.round(price * 100),
            product_data: { name: `Boost ${boostDef.name} · Guía ZMG` },
          },
        },
      ],
      metadata: { externalReference: ref },
      success_url: `${baseUrl}/dashboard/boosts?boost=exitoso`,
      cancel_url: `${baseUrl}/dashboard/boosts?boost=cancelado`,
    })
    return NextResponse.json({ url: checkout.url })
  } catch (error) {
    console.error("Error creating boost preference:", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear el boost" }, { status: 500 })
  }
}
