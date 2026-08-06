"use client"

import { useState } from "react"
import { Flag } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

const REASONS = [
  { value: "cerrado", label: "El negocio cerró o ya no existe" },
  { value: "datos-incorrectos", label: "Información incorrecta (teléfono, dirección, horario…)" },
  { value: "duplicado", label: "Perfil duplicado" },
  { value: "inapropiado", label: "Contenido inapropiado" },
  { value: "otro", label: "Otro" },
]

// Botón discreto para que cualquiera reporte un negocio o sugiera un cambio.
export function ReportButton({ businessId }: { businessId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("datos-incorrectos")
  const [detail, setDetail] = useState("")
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/business/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, reason, detail }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "No se pudo enviar")
      }
      toast.success("Gracias, recibimos tu reporte. Lo revisaremos.")
      setOpen(false)
      setDetail("")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
      >
        <Flag className="h-3.5 w-3.5" />
        Reportar o sugerir un cambio
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reportar o sugerir un cambio</DialogTitle>
            <DialogDescription>Cuéntanos qué está mal y nuestro equipo lo revisa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid gap-2">
              {REASONS.map((r) => (
                <label key={r.value} className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="radio"
                    name="report-reason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="h-4 w-4"
                  />
                  {r.label}
                </label>
              ))}
            </div>
            <Textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="Detalles (opcional)"
              maxLength={500}
              className="min-h-20"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Enviando…" : "Enviar reporte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
