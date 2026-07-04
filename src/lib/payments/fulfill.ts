import { prisma } from "@/lib/prisma"

type Provider = "MERCADO_PAGO" | "STRIPE"

// Activa una membresía a partir de un pago aprobado. Idempotente (upsert por
// providerPaymentId). Reutilizable por cualquier proveedor. Mismo comportamiento
// que el fulfillment inline de Mercado Pago (periodo mensual de 30 días).
export async function fulfillMembership(opts: {
  planSlug: string
  userId: string
  businessId: string
  provider: Provider
  providerPaymentId: string
  amount: number
  metadata?: unknown
}): Promise<{ ok: boolean; reason?: string }> {
  const slug = opts.planSlug.toLowerCase()
  const plan = await prisma.membershipPlan.findUnique({ where: { slug } })
  if (!plan) return { ok: false, reason: "plan-not-found" }

  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const db = prisma as any

  await db.$transaction(async (tx: any) => {
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
        status: "APPROVED",
        processedAt: now,
        metadata: opts.metadata ?? undefined,
      },
      update: { status: "APPROVED", amount: opts.amount, processedAt: now },
    })

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
  })
  return { ok: true }
}
