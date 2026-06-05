import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { PlanesClient } from "./planes-client"

export const dynamic = "force-dynamic"

export default async function AdminPlanesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const plans = await prisma.membershipPlan.findMany({
    orderBy: { priorityLevel: "asc" },
  })

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <PlanesClient plans={JSON.parse(JSON.stringify(plans))} />
    </Suspense>
  )
}
