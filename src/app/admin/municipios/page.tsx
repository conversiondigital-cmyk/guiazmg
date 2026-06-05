import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { MunicipalitiesClient } from "./municipalities-client"

export const dynamic = "force-dynamic"

async function getMunicipalities() {
  const municipalities = await prisma.municipality.findMany({
    include: {
      neighborhoods: { where: { isActive: true } },
      _count: { select: { neighborhoods: true, businesses: true } },
    },
    orderBy: { sortOrder: "asc" },
  })
  return JSON.parse(JSON.stringify(municipalities))
}

export default async function AdminMunicipiosPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/login")
  }

  const municipalities = await getMunicipalities()
  const total = municipalities.length
  const active = municipalities.filter((m: any) => m.isActive).length

  return (
    <Suspense fallback={<div className="p-6">Cargando...</div>}>
      <MunicipalitiesClient municipalities={municipalities} stats={{ total, active }} />
    </Suspense>
  )
}
