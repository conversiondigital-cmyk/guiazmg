import { prisma } from "@/lib/prisma"

type Provider = "MERCADO_PAGO" | "STRIPE"

// Activa una membresía a partir de un pago aprobado. IDEMPOTENTE con guardia de
// "claim": si el pago ya se procesó antes (webhook duplicado — Stripe entrega
// "al menos una vez"), NO vuelve a re-estampar el periodo ni re-notifica.
// Reutilizable por cualquier proveedor. Periodo mensual de 30 días.
export async function fulfillMembership(opts: {
  planSlug: string
  userId: string
  businessId: string
  provider: Provider
  providerPaymentId: string
  amount: number
  metadata?: unknown
}): Promise<{ ok: boolean; reason?: string; alreadyProcessed?: boolean }> {
  const slug = opts.planSlug.toLowerCase()
  const plan = await prisma.membershipPlan.findUnique({ where: { slug } })
  if (!plan) return { ok: false, reason: "plan-not-found" }

  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const db = prisma as any

  const activated: boolean = await db.$transaction(async (tx: any) => {
    // Crea el pago como PENDING sin processedAt (para poder "reclamarlo"). Si ya
    // existe, no se toca en el create.
    await tx.payment.upsert({
      where: { providerPaymentId: opts.providerPaymentId },
      create: {
        userId: opts.userId,
        businessId: opts.businessId,
        amount: opts.amount,
        currency: "MXN",
        provider: opts.provider,
        providerPaymentId: opts.providerPaymentId,
        type: "MEMBERSHIP",
        status: "PENDING",
        metadata: opts.metadata ?? undefined,
      },
      update: {},
    })

    // Reclama el pago: solo el primer webhook (processedAt aún null) gana.
    const claim = await tx.payment.updateMany({
      where: { providerPaymentId: opts.providerPaymentId, processedAt: null },
      data: { processedAt: now, status: "APPROVED", amount: opts.amount },
    })
    if (claim.count === 0) return false // ya procesado por otro webhook → no-op

    await tx.profileMembership.upsert({
      where: { businessId: opts.businessId },
      create: {
        businessId: opts.businessId,
        planId: plan.id,
        provider: opts.provider,
        providerSubscriptionId: opts.providerPaymentId,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
      update: {
        planId: plan.id,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
      },
    })
    return true
  })

  return { ok: true, alreadyProcessed: !activated }
}

// Activa un BOOST de una publicación de MARKETPLACE a partir de un pago aprobado.
// Marca la publicación como destacada (isBoosted) con vencimiento a N días.
// IDEMPOTENTE con la misma guardia de "claim" que la membresía. Reutilizable por
// cualquier proveedor (Stripe / Mercado Pago).
export async function fulfillMarketplaceBoost(opts: {
  marketplaceListingId: string
  userId: string
  durationDays: number
  provider: Provider
  providerPaymentId: string
  amount: number
  metadata?: unknown
}): Promise<{ ok: boolean; reason?: string; alreadyProcessed?: boolean }> {
  const now = new Date()
  const db = prisma as any

  const applied: boolean = await db.$transaction(async (tx: any) => {
    await tx.payment.upsert({
      where: { providerPaymentId: opts.providerPaymentId },
      create: {
        userId: opts.userId,
        amount: opts.amount,
        currency: "MXN",
        provider: opts.provider,
        providerPaymentId: opts.providerPaymentId,
        type: "BOOST",
        status: "PENDING",
        metadata: opts.metadata ?? undefined,
      },
      update: {},
    })

    // Solo el primer webhook (processedAt aún null) aplica el boost.
    const claim = await tx.payment.updateMany({
      where: { providerPaymentId: opts.providerPaymentId, processedAt: null },
      data: { processedAt: now, status: "APPROVED", amount: opts.amount },
    })
    if (claim.count === 0) return false

    // Extiende sobre el vencimiento vigente si aún no expira (compra encadenada).
    const current = await tx.marketplaceListing.findUnique({
      where: { id: opts.marketplaceListingId },
      select: { boostExpiresAt: true },
    })
    const base = current?.boostExpiresAt && current.boostExpiresAt > now ? current.boostExpiresAt : now
    const newExpiry = new Date(base.getTime() + opts.durationDays * 24 * 60 * 60 * 1000)

    await tx.marketplaceListing.update({
      where: { id: opts.marketplaceListingId },
      data: { isBoosted: true, boostExpiresAt: newExpiry },
    })
    return true
  })

  return { ok: true, alreadyProcessed: !applied }
}
