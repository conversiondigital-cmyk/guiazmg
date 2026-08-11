import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

// Lista de solo-lectura de QUIÉN canjeó un cupón de días gratis (usuario, negocio y
// fecha), para el panel /admin/cupones-prueba. MembershipCouponRedemption no tiene
// relación Prisma con User/Profile, así que se juntan por id en dos consultas.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await ctx.params
  const reds = await prisma.membershipCouponRedemption.findMany({
    where: { couponId: id },
    orderBy: { redeemedAt: "asc" },
    select: { id: true, userId: true, businessId: true, days: true, redeemedAt: true },
  })

  if (reds.length === 0) return NextResponse.json({ redemptions: [] })

  const userIds = [...new Set(reds.map((r) => r.userId))]
  const bizIds = [...new Set(reds.map((r) => r.businessId))]
  const [users, bizzes] = await Promise.all([
    prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } }),
    prisma.profile.findMany({ where: { id: { in: bizIds } }, select: { id: true, name: true, slug: true } }),
  ])
  const uById = new Map(users.map((u) => [u.id, u]))
  const bById = new Map(bizzes.map((b) => [b.id, b]))

  const redemptions = reds.map((r) => {
    const u = uById.get(r.userId)
    const b = bById.get(r.businessId)
    return {
      id: r.id,
      days: r.days,
      redeemedAt: r.redeemedAt,
      userName: u?.name ?? null,
      userEmail: u?.email ?? null,
      businessName: b?.name ?? null,
      businessSlug: b?.slug ?? null,
    }
  })

  return NextResponse.json({ redemptions })
}
