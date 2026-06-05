export const dynamic = "force-dynamic"

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { ClaimReviewList } from "./claim-review-list"

export default async function AdminClaimsPage() {
  const session = await auth()
  if (session?.user?.role !== "ADMIN" && session?.user?.role !== "EDITOR") redirect("/dashboard")

  const claims = await prisma.businessClaimRequest.findMany({
    include: { user: { select: { id: true, name: true, email: true } }, business: { select: { id: true, name: true, slug: true } } },
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
