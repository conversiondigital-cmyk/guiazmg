"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Edit3, Trash2, Play, Pause, Loader2 } from "@/lib/icons"

export function ProductActions({
  id,
  status,
  kind = "PRODUCT",
}: {
  id: string
  status: string
  kind?: "PRODUCT" | "SERVICE"
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const isActive = status === "ACTIVE"
  const noun = kind === "SERVICE" ? "servicio" : "producto"
  const Noun = noun[0].toUpperCase() + noun.slice(1)
  const editBase = kind === "SERVICE" ? "/dashboard/servicios" : "/dashboard/productos"

  const patchStatus = async (next: "ACTIVE" | "ARCHIVED") => {
    setBusy(true)
    try {
      const res = await fetch(`/api/listings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "No se pudo actualizar")
        return
      }
      toast.success(next === "ACTIVE" ? `${Noun} activado` : `${Noun} pausado`)
      router.refresh()
    } catch {
      toast.error("No se pudo actualizar")
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    if (!confirm(`¿Eliminar este ${noun}? No se mostrará en tu perfil.`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/listings/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "No se pudo eliminar")
        return
      }
      toast.success(`${Noun} eliminado`)
      router.refresh()
    } catch {
      toast.error("No se pudo eliminar")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Button asChild variant="ghost" size="icon-xs" title="Editar">
        <Link href={`${editBase}/${id}/editar`}>
          <Edit3 className="h-3.5 w-3.5" />
        </Link>
      </Button>
      {isActive ? (
        <Button variant="ghost" size="icon-xs" title="Pausar" disabled={busy} onClick={() => patchStatus("ARCHIVED")}>
          <Pause className="h-3.5 w-3.5" />
        </Button>
      ) : (
        <Button variant="ghost" size="icon-xs" title="Activar" disabled={busy} onClick={() => patchStatus("ACTIVE")}>
          <Play className="h-3.5 w-3.5" />
        </Button>
      )}
      <Button variant="ghost" size="icon-xs" title="Eliminar" disabled={busy} onClick={remove}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </Button>
    </div>
  )
}
