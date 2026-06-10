"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Database } from "lucide-react"

export function DemoDataToggle({
  initialEnabled,
  initialCount,
}: {
  initialEnabled: boolean
  initialCount: number
}) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  async function toggle(next: boolean) {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/demo-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "No se pudo completar la acción")
      setEnabled(data.enabled)
      setCount(data.count)
      toast.success(
        next
          ? `Datos demo habilitados — ${data.affected} negocios creados`
          : `Datos demo deshabilitados — ${data.affected} negocios eliminados`
      )
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error inesperado")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Database className="h-4 w-4" />
          Negocios de demostración
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{enabled ? "Habilitados" : "Deshabilitados"}</p>
            <p className="text-xs text-muted-foreground">
              {enabled
                ? `${count} negocios demo visibles en el sitio.`
                : "No hay negocios demo. Actívalos para poblar el sitio con ejemplos."}
            </p>
          </div>
          <Switch checked={enabled} disabled={loading} onCheckedChange={(c) => toggle(c)} />
        </div>
        <p className="text-xs text-muted-foreground">
          Los negocios demo se marcan internamente (<code>isDemo</code>) y no afectan a los reales.
          Al deshabilitar se eliminan por completo de la base de datos.
        </p>
      </CardContent>
    </Card>
  )
}
