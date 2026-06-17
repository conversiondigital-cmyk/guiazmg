"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { MoreHorizontal, Clock, CheckCircle, XCircle } from "@/lib/icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/**
 * Acciones de estado de un reporte. Sustituye al <form> con server action +
 * botones submit, que NO funcionaba: el DropdownMenuContent se portalea fuera
 * del <form>, así que los botones type="submit" quedaban desconectados.
 */
export function ReportActions({
  reportId,
  currentStatus,
}: {
  reportId: string
  currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function setStatus(status: string) {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reportId, status }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "Error al actualizar")
      }
      toast.success("Reporte actualizado")
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
        {currentStatus !== "INVESTIGATING" && (
          <DropdownMenuItem onClick={() => setStatus("INVESTIGATING")}>
            <Clock className="size-4 text-blue-600" />
            Marcar en revisión
          </DropdownMenuItem>
        )}
        {currentStatus !== "RESOLVED" && (
          <DropdownMenuItem onClick={() => setStatus("RESOLVED")}>
            <CheckCircle className="size-4 text-green-600" />
            Resolver
          </DropdownMenuItem>
        )}
        {currentStatus !== "DISMISSED" && (
          <DropdownMenuItem onClick={() => setStatus("DISMISSED")}>
            <XCircle className="size-4 text-gray-600" />
            Descartar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Filtro por motivo. Antes era un <select onChange> dentro de un Server
 * Component, lo que lanza error en runtime. Ahora navega desde el cliente
 * preservando el resto de filtros (status, q).
 */
export function ReportReasonFilter({
  reasons,
  currentReason,
}: {
  reasons: string[]
  currentReason: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    const value = e.target.value
    if (value) params.set("reason", value)
    else params.delete("reason")
    params.delete("page")
    const qs = params.toString()
    router.push(`/admin/reportes${qs ? `?${qs}` : ""}`)
  }

  return (
    <select
      value={currentReason}
      onChange={onChange}
      className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm"
    >
      <option value="">Todos los motivos</option>
      {reasons.map((r) => (
        <option key={r} value={r}>{r}</option>
      ))}
    </select>
  )
}
