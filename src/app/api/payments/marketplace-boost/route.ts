import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildPreferencePayload, createPreference } from "@/lib/mercadopago"
import { getStripe } from "@/lib/stripe"
import { getPublicAppUrl } from "@/lib/env"

// Crea el checkout para DESTACAR (boost) una publicación de marketplace, con el
// proveedor elegido (Stripe o Mercado Pago). Valida que la publicación sea del
// usuario. El fulfillment (marcar isBoosted) lo hace el webnhook correspondiente
// vía fulfillMarketplaceBoost, idempotente. externalReference unifica el formato:
//   mktboost:<boostDefinitionId>:<userId>:<marketplaceListingId>
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { boostDefinitionId, marketplaceListingId, provider } = (await request.json().catch(() => ({}))) as {
      boostDefinitionId?: string
      marketplaceListingId?: string
      provider?: string
    }

    if (!boostDefinitionId || !marketplaceListingId) {
      return NextResponse.json({ error: "Datos de boost inválidos" }, { status: 400 })
    }

    // La publicación debe ser del usuario y estar vigente.
    const listing = await prisma.marketplaceListing.findFirst({
      where: { id: marketplaceListingId, userId: session.user.id, deletedAt: null },
      select: { id: true, title: true, status: true },
    })
    if (!listing) {
      return NextResponse.json({ error: "Publicación no encontrada" }, { status: 404 })
    }
    if (!["ACTIVE", "PENDING"].includes(listing.status)) {
      return NextResponse.json({ error: "Solo puedes destacar publicaciones activas" }, { status: 400 })
    }

    const boostDef = await prisma.boostDefinition.findUnique({ where: { id: boostDefinitionId } })
    if (!boostDef || !boostDef.isActive) {
      return NextResponse.json({ error: "Tipo de boost inválido o inactivo" }, { status: 400 })
    }

    const ref = `mktboost:${boostDefinitionId}:${session.user.id}:${marketplaceListingId}`
    const baseUrl = getPublicAppUrl()
    const price = Number(boostDef.price)

    if (provider === "STRIPE") {
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
              product_data: { name: `Destacar "${listing.title}" (${boostDef.name}) · Guía ZMG` },
            },
          },
        ],
        metadata: { externalReference: ref },
        success_url: `${baseUrl}/dashboard/marketplace?boost=exitoso`,
        cancel_url: `${baseUrl}/dashboard/marketplace?boost=cancelado`,
      })
      return NextResponse.json({ url: checkout.url })
    }

    // Por defecto: Mercado Pago.
    const payload = buildPreferencePayload({
      title: `Destacar ${boostDef.name} - Guía ZMG`,
      quantity: 1,
      unitPrice: price,
      externalReference: ref,
    })
    const response = await createPreference(payload)
    return NextResponse.json({ url: response.init_point, paymentId: response.id })
  } catch (error) {
    console.error("[MARKETPLACE_BOOST]", error instanceof Error ? error.message : error)
    return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 })
  }
}
