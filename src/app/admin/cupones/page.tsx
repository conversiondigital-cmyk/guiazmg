import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { CuponesClient } from "./cupones-client"

export const dynamic = "force-dynamic"

export default async function AdminCuponesPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    redirect("/auth/login")
  }

  const coupons = await prisma.promotionCoupon.findMany({
    orderBy: { createdAt: "desc" },
  })

  const now = new Date()
  const total = coupons.length
  const active = coupons.filter((c) => c.isActive).length
  const expired = coupons.filter((c) => c.expiresAt && new Date(c.expiresAt) < now).length

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <CuponesClient
        coupons={JSON.parse(JSON.stringify(coupons))}
        stats={{ total, active, expired }}
      />
    </Suspense>
  )
}
