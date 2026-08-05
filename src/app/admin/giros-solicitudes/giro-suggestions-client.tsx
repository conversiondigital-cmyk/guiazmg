"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { MoreHorizontal, Clock, CheckCircle, XCircle } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Acciones de estado de una solicitud de giro (pendiente / aprobada / rechazada).
export function GiroSuggestionActions({
  id,
  currentStatus,
}: {
  id: string
  currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function setStatus(status: string) {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/giro-suggestions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "Error al actualizar")
      }
      toast.success("Solicitud actualizada")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo actualizar")
    } finally {
      setLoading(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" disabled={loading} />}>
        <MoreHorizontal className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {currentStatus !== "APPROVED" && (
          <DropdownMenuItem onClick={() => setStatus("APPROVED")}>
            <CheckCircle className="size-4 text-green-600" />
            Marcar como agregada
          </DropdownMenuItem>
        )}
        {currentStatus !== "REJECTED" && (
          <DropdownMenuItem onClick={() => setStatus("REJECTED")}>
            <XCircle className="size-4 text-red-600" />
            Rechazar
          </DropdownMenuItem>
        )}
        {currentStatus !== "PENDING" && (
          <DropdownMenuItem onClick={() => setStatus("PENDING")}>
            <Clock className="size-4 text-amber-600" />
            Marcar pendiente
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
