import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getStripe, getStripeWebhookSecret } from "@/lib/stripe"
import { fulfillMembership, fulfillMarketplaceBoost, fulfillBusinessBoost } from "@/lib/payments/fulfill"
import { createNotification } from "@/lib/notifications/create"
import { incrementCouponUsage } from "@/lib/coupons"
import { createBusinessForOwner } from "@/lib/business/create"
import { businessSchema } from "@/lib/validations"

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

    // Se cumple en `completed` (tarjeta) y en `async_payment_succeeded` (métodos
    // diferidos como OXXO/SPEI que confirman después). En ambos exigimos que el
    // pago esté CONFIRMADO (`payment_status === "paid"`): nunca se activa sin cobro.
    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {
      const s = event.data.object as {
        id: string
        amount_total?: number | null
        payment_status?: string | null
        metadata?: Record<string, string> | null
      }
      if (s.payment_status !== "paid") {
        // Pago aún no confirmado (p. ej. voucher OXXO generado pero no pagado):
        // NO se activa nada; se marca procesado y se espera async_payment_succeeded.
        if (webhookEventId) {
          await prisma.webhookEvent
            .update({ where: { id: webhookEventId }, data: { status: "PROCESSED" } })
            .catch(() => {})
        }
        return NextResponse.json({ received: true })
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

      // Boost de un NEGOCIO o producto: boost:<boostDefId>:<businessId>:<userId>[:<listingId>]
      if (kind === "boost") {
        const [, boostDefinitionId, boostBusinessId, boostUserId, boostListingId] = parts
        if (boostDefinitionId && boostBusinessId && boostUserId) {
          const result = await fulfillBusinessBoost({
            boostDefinitionId,
            businessId: boostBusinessId,
            userId: boostUserId,
            listingId: boostListingId || null,
            provider: "STRIPE",
            providerPaymentId: s.id,
            amount,
            metadata: { source: "stripe", sessionId: s.id },
          })
          if (result.ok && !result.alreadyProcessed) {
            await createNotification({
              userId: boostUserId,
              type: "PAYMENT",
              title: "Boost activado",
              message: `Tu boost "${result.boostName}" quedó activo por ${result.durationDays} días.`,
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
          // Registra el uso del cupón solo aquí (primera activación) para que el
          // conteo no se infle con reintentos del webhook.
          await incrementCouponUsage(s.metadata?.couponCode)
          await createNotification({
            userId,
            type: "PAYMENT",
            title: "Pago recibido",
            message: "Tu membresía quedó activa.",
          }).catch(() => {})
        }
      }

      // Alta en espera de pago (cliente sin cupón): el negocio NO existía; se crea
      // ahora que el pago se concretó. `businessId` aquí es el id del pending.
      // Idempotente: si el usuario ya tiene negocio (reintento), no se duplica.
      if (kind === "pendingmembership" && planSlug && userId && businessId) {
        const pendingId = businessId
        const pend = await prisma.pendingRegistration.findUnique({ where: { id: pendingId } })
        const existing = await prisma.profile.findFirst({
          where: { ownerId: userId, deletedAt: null },
          select: { id: true },
        })
        let bizId: string | null = existing?.id ?? null
        if (!bizId && pend) {
          const parsed = businessSchema.safeParse(pend.data)
          if (parsed.success) {
            try {
              const created = await createBusinessForOwner({ userId, data: parsed.data, status: "ACTIVE" })
              bizId = created.id
            } catch (e) {
              console.error("[stripe-webhook] pending create failed:", e instanceof Error ? e.message : e)
            }
          }
        }
        if (bizId) {
          const result = await fulfillMembership({
            planSlug,
            userId,
            businessId: bizId,
            provider: "STRIPE",
            providerPaymentId: s.id,
            amount,
            metadata: { source: "stripe", sessionId: s.id },
          })
          if (result.ok && !result.alreadyProcessed) {
            await incrementCouponUsage(s.metadata?.couponCode)
            await createNotification({
              userId,
              type: "PAYMENT",
              title: "Pago recibido",
              message: "Tu negocio quedó publicado y activo.",
            }).catch(() => {})
          }
          if (pend) await prisma.pendingRegistration.delete({ where: { id: pendingId } }).catch(() => {})
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
    // 500 (no 200): la firma ya se validó arriba, así que un error aquí es interno
    // (p. ej. BD transitoria). Devolver 5xx hace que Stripe REINTENTE la entrega,
    // evitando el caso "cobró pero no activó" por un fallo momentáneo.
    return NextResponse.json({ error: "fulfillment failed" }, { status: 500 })
  }
}
