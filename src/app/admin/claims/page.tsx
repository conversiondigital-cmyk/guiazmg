export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClaimReviewList } from "./claim-review-list"

export default async function AdminClaimsPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") redirect("/dashboard")

  // Evita include { business } — falla por mismatch de columna FK en DB.
  // El `user` include sí funciona ya que no usa el Proxy.
  const claims = await prisma.businessClaimRequest.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Solicitudes de Reclamación</h1>
        <p className="text-gray-500">Revisa y aprueba solicitudes de propietarios que reclaman negocios importados.</p>
      </div>
      <ClaimReviewList claims={claims} />
    </div>
  )
}
