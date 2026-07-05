import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MembershipCouponsClient } from "./client"

export const dynamic = "force-dynamic"

export default async function CuponesPruebaPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN") redirect("/")

  const [plans, coupons] = await Promise.all([
    prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: "asc" },
      select: { id: true, name: true },
    }),
    prisma.membershipCoupon.findMany({
      orderBy: { createdAt: "desc" },
      include: { plan: { select: { name: true } } },
    }),
  ])

  return (
    <MembershipCouponsClient
      plans={plans}
      initialCoupons={JSON.parse(JSON.stringify(coupons))}
    />
  )
}
