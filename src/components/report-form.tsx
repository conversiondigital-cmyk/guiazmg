"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const REASONS = [
  "Contenido inapropiado",
  "Spam o publicidad engañosa",
  "Estafa o fraude",
  "Información falsa",
  "Producto/servicio ilegal",
  "Otro",
]

export function ReportForm({ type, id }: { type?: string; id?: string }) {
  const router = useRouter()
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!reason) {
      toast.error("Selecciona un motivo")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id, reason, description }),
      })
      if (!res.ok) {
        const e = await res.json().catch(() => ({}))
        throw new Error(e.error ?? "Error al enviar el reporte")
      }
      toast.success("Reporte enviado. Gracias por avisar, lo revisaremos.")
      router.back()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo enviar el reporte")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-gray-100 bg-white p-6">
      <div className="space-y-2">
        <Label>Motivo</Label>
        <Select value={reason} onValueChange={(v) => setReason(v ?? "")}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un motivo" />
          </SelectTrigger>
          <SelectContent>
            {REASONS.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="report-desc">Detalles (opcional)</Label>
        <Textarea
          id="report-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el problema..."
          rows={4}
        />
      </div>
      <Button onClick={submit} disabled={loading || !reason} className="w-full">
        {loading ? "Enviando..." : "Enviar reporte"}
      </Button>
    </div>
  )
}
