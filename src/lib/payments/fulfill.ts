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
  // Suscripción recurrente de Stripe (opcional). Si viene, se guardan el id de
  // suscripción y de cliente (para el portal de cancelación), y el fin de período
  // lo dicta Stripe (current_period_end) en vez del +30 días fijo.
  subscriptionId?: string | null
  customerId?: string | null
  periodEnd?: Date | null
}): Promise<{ ok: boolean; reason?: string; alreadyProcessed?: boolean }> {
  const slug = opts.planSlug.toLowerCase()
  const plan = await prisma.membershipPlan.findUnique({ where: { slug } })
  if (!plan) return { ok: false, reason: "plan-not-found" }

  const now = new Date()
  const periodEnd = opts.periodEnd ?? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const subId = opts.subscriptionId ?? opts.providerPaymentId
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
        providerSubscriptionId: subId,
        providerCustomerId: opts.customerId ?? null,
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        // Suscripción real → NO cancelar al final del periodo (renueva sola). Trial
        // por cupón sí queda con cancelAtPeriodEnd=true (lo pone redeem-membership).
        cancelAtPeriodEnd: false,
      },
      update: {
        planId: plan.id,
        provider: opts.provider,
        providerSubscriptionId: subId,
        ...(opts.customerId ? { providerCustomerId: opts.customerId } : {}),
        status: "ACTIVE",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        cancelAtPeriodEnd: false,
        // Reinicia la bandera de aviso: el periodo nuevo debe poder recibir su
        // propio recordatorio previo al vencimiento (si no, solo se avisa una vez).
        renewalNotifiedAt: null,
      },
    })

    // Pagar activa el negocio: tanto los recién registrados (PENDING_REVIEW) como
    // los que quedaron ocultos por vencimiento (INACTIVE) pasan a ACTIVE. No toca
    // perfiles SUSPENDED (suspendidos por el admin) ni borrados.
    await tx.profile.updateMany({
      where: { id: opts.businessId, status: { in: ["INACTIVE", "PENDING_REVIEW"] }, deletedAt: null },
      data: { status: "ACTIVE" },
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

// Activa un BOOST de NEGOCIO (el perfil, o un producto del catálogo si viene
// listingId) a partir de un pago aprobado. Crea el registro Boost y marca
// isBoosted/boostedUntil por N días. IDEMPOTENTE con la misma guardia de "claim".
// Reutilizable por cualquier proveedor (Stripe / Mercado Pago).
export async function fulfillBusinessBoost(opts: {
  boostDefinitionId: string
  businessId: string
  userId: string
  listingId?: string | null
  provider: Provider
  providerPaymentId: string
  amount: number
  metadata?: unknown
}): Promise<{ ok: boolean; reason?: string; alreadyProcessed?: boolean; boostName?: string; durationDays?: number }> {
  const boostDef = await prisma.boostDefinition.findUnique({ where: { id: opts.boostDefinitionId } })
  if (!boostDef) return { ok: false, reason: "boost-def-not-found" }

  const now = new Date()
  const db = prisma as any

  const applied: boolean = await db.$transaction(async (tx: any) => {
    const payment = await tx.payment.upsert({
      where: { providerPaymentId: opts.providerPaymentId },
      create: {
        userId: opts.userId,
        businessId: opts.businessId,
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

    const claim = await tx.payment.updateMany({
      where: { providerPaymentId: opts.providerPaymentId, processedAt: null },
      data: { processedAt: now, status: "APPROVED", amount: opts.amount },
    })
    if (claim.count === 0) return false

    const endsAt = new Date(now.getTime() + boostDef.durationDays * 24 * 60 * 60 * 1000)
    await tx.boost.create({
      data: {
        businessId: opts.businessId,
        listingId: opts.listingId ?? null,
        paymentId: payment.id,
        pricePaid: boostDef.price,
        priorityScore: boostDef.priorityBonus,
        startsAt: now,
        endsAt,
      },
    })

    // Marca el impulso para que el ranking lo priorice; el cron lo apaga al vencer.
    if (opts.listingId) {
      await tx.listing.update({ where: { id: opts.listingId }, data: { isBoosted: true, boostedUntil: endsAt } })
    } else {
      await tx.profile.update({ where: { id: opts.businessId }, data: { isBoosted: true, boostedUntil: endsAt } })
    }
    return true
  })

  return { ok: true, alreadyProcessed: !applied, boostName: boostDef.name, durationDays: boostDef.durationDays }
}

// ¿El negocio ya tiene un boost VIGENTE? Regla: solo 1 boost activo a la vez; hay
// que esperar a que termine para comprar otro.
export async function hasActiveBusinessBoost(businessId: string): Promise<boolean> {
  const active = await prisma.boost.findFirst({
    where: { businessId, status: "ACTIVE", endsAt: { gt: new Date() } },
    select: { id: true },
  })
  return !!active
}
