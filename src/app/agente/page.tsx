import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { AgentDashboardClient } from "./dashboard-client"

export const dynamic = "force-dynamic"

export default async function AgentDashboardPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "SALES_AGENT") {
    redirect("/auth/login")
  }

  return (
    <Suspense fallback={<div className="p-8">Cargando...</div>}>
      <AgentDashboardClient />
    </Suspense>
  )
}
