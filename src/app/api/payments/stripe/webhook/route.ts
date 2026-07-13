import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe"
import { fulfillMembership, fulfillMarketplaceBoost } from "@/lib/payments/fulfill"
import { createNotification } from "@/lib/notifications/create"

export const dynamic = "force-dynamic"

// Webhook de Stripe: verifica la firma con stripe_webhook_secret y, en
// checkout.session.completed, activa la membresía. Idempotente vía fulfill.
export async function POST(request: Request) {
  let webhookEventId: string | null = null
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("stripe-signature") || ""

    const stripe = await getStripe()
    const secret = await getStripeWebhookSecret()
    if (!stripe || !secret) {
      return NextResponse.json({ error: "Stripe no configurado" }, { status: 400 })
    }

    let event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret)
    } catch (e) {
      return NextResponse.json(
        { error: `Firma inválida: ${e instanceof Error ? e.message : "error"}` },
        { status: 401 }
      )
    }

    const logged = await prisma.webhookEvent
      .create({
        data: {
          provider: "STRIPE",
          eventType: event.type,
          eventId: event.id,
          payload: rawBody.slice(0, 10000),
          status: "RECEIVED",
        },
      })
      .catch(() => null)
    webhookEventId = logged?.id ?? null

    if (event.type === "checkout.session.completed") {
      const s = event.data.object as {
        id: string
        amount_total?: number | null
        metadata?: Record<string, string> | null
      }
      const externalRef = s.metadata?.externalReference || ""
      const parts = externalRef.split(":")
      const [kind, planSlug, userId, businessId] = parts
      const amount = (s.amount_total ?? 0) / 100

      // Boost de una publicación de marketplace: mktboost:<boostDefId>:<userId>:<listingId>
      if (kind === "mktboost") {
        const [, boostDefinitionId, boostUserId, marketplaceListingId] = parts
        const boostDef = boostDefinitionId
          ? await prisma.boostDefinition.findUnique({ where: { id: boostDefinitionId }, select: { durationDays: true, name: true } })
          : null
        if (boostDef && boostUserId && marketplaceListingId) {
          const result = await fulfillMarketplaceBoost({
            marketplaceListingId,
            userId: boostUserId,
            durationDays: boostDef.durationDays,
            provider: "STRIPE",
            providerPaymentId: s.id,
            amount,
            metadata: { source: "stripe", sessionId: s.id },
          })
          if (result.ok && !result.alreadyProcessed) {
            await createNotification({
              userId: boostUserId,
              type: "PAYMENT",
              title: "Publicación destacada",
              message: `Tu publicación quedó destacada por ${boostDef.durationDays} días.`,
            }).catch(() => {})
          }
        }
      }

      if (kind === "membership" && planSlug && userId && businessId) {
        const result = await fulfillMembership({
          planSlug,
          userId,
          businessId,
          provider: "STRIPE",
          providerPaymentId: s.id,
          amount,
          metadata: { source: "stripe", sessionId: s.id },
        })
        // Solo notifica en la PRIMERA activación (evita re-notificar en webhooks
        // duplicados que Stripe entrega "al menos una vez").
        if (result.ok && !result.alreadyProcessed) {
          await createNotification({
            userId,
            type: "PAYMENT",
            title: "Pago recibido",
            message: "Tu membresía quedó activa.",
          }).catch(() => {})
        }
      }
    }

    if (webhookEventId) {
      await prisma.webhookEvent
        .update({ where: { id: webhookEventId }, data: { status: "PROCESSED" } })
        .catch(() => {})
    }
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[stripe-webhook] failed:", error)
    if (webhookEventId) {
      await prisma.webhookEvent
        .update({
          where: { id: webhookEventId },
          data: { status: "ERROR", error: error instanceof Error ? error.message : String(error) },
        })
        .catch(() => {})
    }
    return NextResponse.json({ received: true })
  }
}
