import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { GrantBenefitForm } from "@/components/admin/grant-benefit-form"

export const dynamic = "force-dynamic"

export default async function AdminPromocionesAdminPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const [businesses, plans, boosts] = await Promise.all([
    prisma.profile.findMany({
      where: { deletedAt: null, status: { in: ["ACTIVE", "PENDING_REVIEW"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: 500,
    }),
    prisma.membershipPlan.findMany({
      select: { id: true, name: true },
      orderBy: { priorityLevel: "asc" },
    }),
    prisma.boostDefinition.findMany({
      where: { isActive: true },
      select: { id: true, name: true, durationDays: true },
      orderBy: { durationDays: "asc" },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Regalos y beneficios</h1>
        <p className="text-sm text-muted-foreground">
          Otorga un plan gratis o un boost de regalo a un negocio. Se aplica al instante y el dueño
          recibe una notificación.
        </p>
      </div>

      <GrantBenefitForm businesses={businesses} plans={plans} boosts={boosts} />
    </div>
  )
}
