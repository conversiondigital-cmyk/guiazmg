import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { getDemoDataStatus } from "@/lib/demo-data"
import { DemoDataToggle } from "@/components/admin/demo-data-toggle"

export const dynamic = "force-dynamic"

export default async function AdminDemoPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/auth/login")

  const status = await getDemoDataStatus()

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Datos demo</h1>
        <p className="text-sm text-muted-foreground">
          Habilita o deshabilita negocios de demostración para probar el sitio (búsqueda, perfiles,
          boosts) sin afectar la información real.
        </p>
      </div>

      <DemoDataToggle initialEnabled={status.enabled} initialCount={status.count} />
    </div>
  )
}
