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
