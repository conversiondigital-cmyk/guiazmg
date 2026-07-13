"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { Eye, Edit3, Trash2, Loader2, Check, Pause, Play } from "@/lib/icons"
import { confirmDialog } from "@/components/ui/system-dialog"
import { toast } from "sonner"

export function ListingActions({
  id,
  viewHref,
  editHref,
  status,
}: {
  id: string
  viewHref: string
  editHref: string
  status?: string
}) {
  const router = useRouter()
  const [deleting, setDeleting] = useState(false)
  const [busy, setBusy] = useState(false)

  const applyStatus = async (statusAction: "SOLD" | "PAUSE" | "ACTIVATE", okMsg: string) => {
    setBusy(true)
    try {
      const res = await fetch(`/api/marketplace/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusAction }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || "No se pudo actualizar")
        return
      }
      toast.success(okMsg)
      router.refresh()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async () => {
    const ok = await confirmDialog({
      title: "Eliminar publicación",
      description: "Se quitará del marketplace. Esta acción no se puede deshacer.",
      confirmText: "Eliminar",
      destructive: true,
    })
    if (!ok) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/marketplace/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        toast.error(d.error || "No se pudo eliminar")
        return
      }
      toast.success("Publicación eliminada")
      router.refresh()
    } catch {
      toast.error("Error de conexión")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-1">
      <Link href={viewHref} target="_blank" title="Ver" className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }))}>
        <Eye className="h-3.5 w-3.5" />
      </Link>
      <Link href={editHref} title="Editar" className={cn(buttonVariants({ variant: "ghost", size: "icon-xs" }))}>
        <Edit3 className="h-3.5 w-3.5" />
      </Link>
      {status === "ACTIVE" && (
        <>
          <Button variant="ghost" size="icon-xs" title="Marcar como vendido" onClick={() => applyStatus("SOLD", "Marcada como vendida")} disabled={busy}>
            <Check className="h-3.5 w-3.5 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon-xs" title="Pausar" onClick={() => applyStatus("PAUSE", "Publicación pausada")} disabled={busy}>
            <Pause className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
      {(status === "HIDDEN" || status === "EXPIRED" || status === "SOLD") && (
        <Button variant="ghost" size="icon-xs" title="Reactivar (30 días)" onClick={() => applyStatus("ACTIVATE", "Publicación reactivada")} disabled={busy}>
          <Play className="h-3.5 w-3.5 text-green-600" />
        </Button>
      )}
      <Button variant="ghost" size="icon-xs" title="Eliminar" onClick={onDelete} disabled={deleting}>
        {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5 text-destructive" />}
      </Button>
    </div>
  )
}
