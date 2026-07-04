import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createNotification } from "@/lib/notifications/create"
import { getSetting } from "@/lib/settings"
import crypto from "node:crypto"

function mapMpStatus(mpStatus: string): "PENDING" | "APPROVED" | "AUTHORIZED" | "REJECTED" | "REFUNDED" | "CANCELLED" {
  const map: Record<string, "PENDING" | "APPROVED" | "AUTHORIZED" | "REJECTED" | "REFUNDED" | "CANCELLED"> = {
    approved: "APPROVED",
    authorized: "AUTHORIZED",
    pending: "PENDING",
    in_process: "PENDING",
    in_mediation: "PENDING",
    rejected: "REJECTED",
    refunded: "REFUNDED",
    cancelled: "CANCELLED",
    charged_back: "REFUNDED",
  }
  return map[mpStatus] || "PENDING"
}

export async function POST(request: Request) {
  let webhookEventId: string | null = null
  try {
    const rawBody = await request.text()
    const signature = request.headers.get("x-signature") || ""
    const requestId = request.headers.get("x-request-id") || ""

    // Lee el secret del panel (Admin→Config→Pagos) con respaldo a env.
    const secret = await getSetting("mercado_pago_webhook_secret", "MERCADO_PAGO_WEBHOOK_SECRET")
    if (!secret) {
      return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
    }

    const tsMatch = signature.match(/ts=(\d+)/)
    const v1Match = signature.match(/v1=([a-f0-9]+)/i)
    if (!tsMatch || !v1Match || !requestId) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const paymentIdFromBody = (() => {
      try {
        const parsed = JSON.parse(rawBody)
        return parsed?.data?.id?.toString() || ""
      } catch {
        return ""
      }
    })()

    const manifests = [
      `id:${paymentIdFromBody};request-id:${requestId};ts:${tsMatch[1]};`,
      `id=${paymentIdFromBody};request-id=${requestId};ts=${tsMatch[1]};`,
      `id:${paymentIdFromBody};ts:${tsMatch[1]};request-id:${requestId};`,
    ]
    const expectedMatches = manifests.some((manifest) => {
      const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex")
      return expected === v1Match[1]
    })
    if (!expectedMatches) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    const body = JSON.parse(rawBody)

    const { type, action, data } = body

    // Registro del evento para el log de webhooks del admin.
    const loggedEvent = await prisma.webhookEvent
      .create({
        data: {
          provider: "MERCADO_PAGO",
          eventType: [type, action].filter(Boolean).join(".") || null,
          eventId: data?.id ? String(data.id) : null,
          payload: rawBody.slice(0, 10000),
          status: "RECEIVED",
        },
      })
      .catch((e) => {
        console.error("[mp-webhook] failed to log event:", e)
        return null
      })
    webhookEventId = loggedEvent?.id ?? null

    const isPaymentUpdate = type === "payment" && (action === "payment.updated" || action === "payment.status_updated")

    if (isPaymentUpdate) {
      const paymentId = data?.id
      if (!paymentId) return NextResponse.json({ received: true })

      const response = await fetch(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
          },
        }
      )

      if (!response.ok) {
        return NextResponse.json({ received: true })
      }

      const payment = await response.json()

      const mappedStatus = mapMpStatus(payment.status)
      await processPaymentUpdate(payment, mappedStatus)
    }

    if (webhookEventId) {
      await prisma.webhookEvent
        .update({ where: { id: webhookEventId }, data: { status: "PROCESSED" } })
        .catch(() => {})
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // Log but still ack with 200 so Mercado Pago does not retry-storm;
    // a persisted payment that failed to apply is now traceable in logs.
    console.error("[mp-webhook] processing failed:", error)
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

async function processPaymentUpdate(paymentData: any, status: "PENDING" | "APPROVED" | "AUTHORIZED" | "REJECTED" | "REFUNDED" | "CANCELLED") {
  const externalRef = paymentData.external_reference || ""
  const providerPaymentId = paymentData.id.toString()

  if (status === "APPROVED") {
    await processApprovedPayment(externalRef, providerPaymentId, paymentData)
  } else if (status === "REJECTED" || status === "CANCELLED") {
    await prisma.payment.updateMany({
      where: { providerPaymentId },
      data: { status },
    })
  } else if (status === "REFUNDED") {
    await prisma.payment.updateMany({
      where: { providerPaymentId },
      data: { status: "REFUNDED" },
    })

    const existingPayment = await prisma.payment.findFirst({
      where: { providerPaymentId },
    })

    if (existingPayment?.type === "MEMBERSHIP" && existingPayment.businessId) {
      await prisma.profileMembership.updateMany({
        where: { businessId: existingPayment.businessId },
        data: { status: "INACTIVE" },
      })
    }

    if (existingPayment?.type === "BOOST") {
      await prisma.boost.updateMany({
        where: { paymentId: existingPayment.id },
        data: { status: "CANCELLED" },
      })
    }
  }
}

async function upsertPaymentByProviderId(
  db: any,
  data: {
    userId: string
    businessId?: string | null
    amount: number
    type: "MEMBERSHIP" | "BOOST"
    status: "PENDING" | "APPROVED" | "AUTHORIZED" | "REJECTED" | "REFUNDED" | "CANCELLED"
    providerPaymentId: string
  }
) {
  const existing = await db.payment.findUnique({
    where: { providerPaymentId: data.providerPaymentId },
  })

  if (existing) {
    return db.payment.update({
      where: { providerPaymentId: data.providerPaymentId },
      data: {
        status: data.status,
        amount: data.amount,
      },
    })
  }

  return db.payment.create({
    data: {
      userId: data.userId,
      businessId: data.businessId ?? null,
      amount: data.amount,
      currency: "MXN",
      provider: "MERCADO_PAGO",
      providerPaymentId: data.providerPaymentId,
      type: data.type,
      status: data.status,
    },
  })
}

async function processApprovedPayment(
  externalRef: string,
  paymentId: string,
  paymentData: any
) {
  const [type, ...rest] = externalRef.split(":")
  const couponCode = paymentData?.metadata?.couponCode || null

  if (type === "membership") {
    const [planSlug, userId, businessId] = rest

    if (!businessId) return

    const amount = paymentData.transaction_amount || 0
    const planSlugLower = planSlug.toLowerCase()

    const plan = await prisma.membershipPlan.findUnique({
      where: { slug: planSlugLower },
    })

    if (!plan) return

    const db = prisma as any

    await db.$transaction(async (tx: any) => {
      const claimed = await tx.payment.upsert({
        where: { providerPaymentId: paymentId },
        create: {
          userId,
          businessId,
          amount,
          currency: "MXN",
          provider: "MERCADO_PAGO",
          providerPaymentId: paymentId,
          type: "MEMBERSHIP",
          status: "PENDING",
          metadata: paymentData,
        },
        update: {
          metadata: paymentData,
          status: "APPROVED",
          amount,
        },
      })

      const claimResult = await tx.payment.updateMany({
        where: { providerPaymentId: paymentId, processedAt: null },
        data: { processedAt: new Date(), status: "APPROVED", amount, metadata: paymentData },
      })

      if (claimResult.count === 0) return claimed

      await tx.profileMembership.upsert({
        where: { businessId },
        create: {
          businessId,
          planId: plan.id,
          provider: "MERCADO_PAGO",
          providerSubscriptionId: paymentId,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
        update: {
          planId: plan.id,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "ACTIVE",
        },
      })

      await upsertPaymentByProviderId(tx, {
        userId,
        businessId,
        amount,
        type: "MEMBERSHIP",
        status: "APPROVED",
        providerPaymentId: paymentId,
      })

      if (couponCode) {
        await tx.promotionCoupon.updateMany({
          where: { code: couponCode, isActive: true },
          data: { usedCount: { increment: 1 } },
        })
      }
    })

    await createNotification({
      userId,
      type: "PAYMENT",
      title: "Pago de membresía aprobado",
      message: "Tu membresía quedó activa. ¡Gracias por tu compra!",
    })
  }

  if (type === "boost") {
    const [boostDefinitionId, businessId, userId] = rest
    const listingId = rest[3] || null
    const amount = paymentData.transaction_amount || 0

    const boostDef = await prisma.boostDefinition.findUnique({
      where: { id: boostDefinitionId },
    })

    if (!boostDef) return

    await prisma.$transaction(async (tx) => {
      const claimed = await tx.payment.upsert({
        where: { providerPaymentId: paymentId },
        create: {
          userId,
          businessId,
          amount,
          currency: "MXN",
          provider: "MERCADO_PAGO",
          providerPaymentId: paymentId,
          type: "BOOST",
          status: "PENDING",
          metadata: paymentData,
        },
        update: {
          metadata: paymentData,
          status: "APPROVED",
          amount,
        },
      })

      const claimResult = await tx.payment.updateMany({
        where: { providerPaymentId: paymentId, processedAt: null },
        data: { processedAt: new Date(), status: "APPROVED", amount, metadata: paymentData },
      })

      if (claimResult.count === 0) return claimed

      const now = new Date()
      const endsAt = new Date(now.getTime() + boostDef.durationDays * 24 * 60 * 60 * 1000)

      await tx.boost.create({
        data: {
          businessId,
          listingId,
          paymentId: claimed.id,
          pricePaid: boostDef.price,
          priorityScore: boostDef.priorityBonus,
          startsAt: now,
          endsAt,
        },
      })

      await upsertPaymentByProviderId(tx, {
        userId,
        businessId,
        amount,
        type: "BOOST",
        status: "APPROVED",
        providerPaymentId: paymentId,
      })

      if (couponCode) {
        await tx.promotionCoupon.updateMany({
          where: { code: couponCode, isActive: true },
          data: { usedCount: { increment: 1 } },
        })
      }
    })

    await createNotification({
      userId,
      type: "PAYMENT",
      title: "Boost activado",
      message: `Tu boost "${boostDef.name}" quedó activo por ${boostDef.durationDays} días.`,
    })
  }
}
