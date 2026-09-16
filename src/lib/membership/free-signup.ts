import { prisma } from "@/lib/prisma"
import { getSetting } from "@/lib/settings"

// Promo "GuíaZMG gratis hasta nuevo aviso": mientras esté activa, los negocios y
// emprendedores se registran sin pago y quedan ACTIVE al instante con la membresía
// de su tipo. Se conserva la distinción Emprendedor/Negocio (cada uno recibe su
// plan y sus topes). Reversible: se apaga poniendo el ajuste `free_signup` en
// "false" (Admin → Configuración → Membresías) sin revertir código.

// GRATIS POR DEFECTO: es gratis salvo que el ajuste esté explícitamente en "false".
// Así queda gratis ya, sin necesidad de escribir el ajuste en la BD.
export async function isFreeSignupEnabled(): Promise<boolean> {
  return (await getSetting("free_signup")).toLowerCase() !== "false"
}

// Vencimiento muy lejano para que el cron de expiración (membership-expire) nunca
// la caduque mientras dure la promo. Al volver a cobrar, las membresías nuevas ya
// no se crean así; estas quedan como "gratis de por vida" para quien se registró.
const FAR_FUTURE = new Date("2099-12-31T00:00:00Z")

// Otorga una membresía GRATIS (ACTIVE, sin pago) al negocio y lo pone visible.
// Idempotente por businessId (@unique). No sobrescribe una membresía de pago
// vigente. Devuelve el nombre del plan otorgado, o null si no se pudo.
export async function grantFreeMembership(
  businessId: string,
  profileType: string | null | undefined,
): Promise<{ planName: string } | null> {
  const slug = profileType === "EMPRENDEDOR" ? "emprendedor" : "negocio"
  const plan = await prisma.membershipPlan.findUnique({
    where: { slug },
    select: { id: true, name: true },
  })
  if (!plan) return null

  const now = new Date()
  try {
    // No sobrescribir una membresía de pago (o trial) aún vigente.
    const existing = await prisma.profileMembership.findUnique({
      where: { businessId },
      select: { status: true, currentPeriodEnd: true },
    })
    const hasActiveMembership =
      !!existing &&
      existing.currentPeriodEnd > now &&
      (existing.status === "ACTIVE" || existing.status === "TRIAL")

    const membershipData = {
      planId: plan.id,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: FAR_FUTURE,
      cancelAtPeriodEnd: false,
      provider: "MERCADO_PAGO" as const,
      providerSubscriptionId: "free:launch",
      renewalNotifiedAt: null,
    }

    // Atómico: crea/actualiza la membresía gratis (si no hay una vigente) y activa
    // el negocio (INACTIVE/PENDING_REVIEW → ACTIVE; no toca suspendidos/borrados).
    await prisma.$transaction([
      ...(hasActiveMembership
        ? []
        : [
            prisma.profileMembership.upsert({
              where: { businessId },
              update: membershipData,
              create: { businessId, ...membershipData },
            }),
          ]),
      prisma.profile.updateMany({
        where: { id: businessId, status: { in: ["INACTIVE", "PENDING_REVIEW"] }, deletedAt: null },
        data: { status: "ACTIVE" },
      }),
    ])
    return { planName: plan.name }
  } catch {
    return null
  }
}
