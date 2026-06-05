import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { BoostsDefinicionesClient } from "./boosts-definiciones-client"

export const dynamic = "force-dynamic"

export default async function AdminBoostsDefinicionesPage() {
  const session = await auth()
  if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "EDITOR")) {
    redirect("/auth/login")
  }

  const definitions = await prisma.boostDefinition.findMany({
    orderBy: { price: "asc" },
  })

  const activeCount = definitions.filter((d) => d.isActive).length

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <BoostsDefinicionesClient
        definitions={JSON.parse(JSON.stringify(definitions))}
        stats={{ total: definitions.length, active: activeCount }}
      />
    </Suspense>
  )
}
