"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Loader2, HelpCircle, Check } from "@/lib/icons"

// Apartado "¿No encuentras tu giro?". Si el usuario no ubica su actividad en el
// catálogo, la solicita aquí: se guarda y nos llega por correo + notificación al
// admin para revisarla y agregarla. Se coloca debajo del selector de categoría.
export function SuggestGiro({ defaultBusinessName }: { defaultBusinessName?: string }) {
  const [open, setOpen] = useState(false)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [categoryHint, setCategoryHint] = useState("")
  const [note, setNote] = useState("")

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Escribe el giro que buscas")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/giros/solicitar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          categoryHint: categoryHint.trim(),
          note: note.trim(),
          businessName: defaultBusinessName ?? "",
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setSent(true)
        setOpen(false)
        setName("")
        setCategoryHint("")
        setNote("")
        toast.success("¡Gracias! Recibimos tu solicitud y la revisaremos.")
      } else {
        toast.error(data.error ?? "No se pudo enviar la solicitud")
      }
    } catch {
      toast.error("No se pudo enviar la solicitud")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-xs text-green-700">
        <Check className="h-3.5 w-3.5" />
        Solicitud enviada. La revisaremos y te avisaremos.
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#006c49] hover:underline"
      >
        <HelpCircle className="h-3.5 w-3.5" />
        ¿No encuentras tu giro? Solicítalo
      </button>
    )
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-[#006c49]/20 bg-[#f5faf8] p-3">
      <p className="text-xs text-gray-600">
        Dinos tu giro y lo revisamos para agregarlo al catálogo. Te avisaremos cuando esté listo.
      </p>
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="¿Cuál es tu giro? Ej: Venta de tamales por pedido"
        maxLength={120}
      />
      <Input
        value={categoryHint}
        onChange={(e) => setCategoryHint(e.target.value)}
        placeholder="¿A qué categoría crees que pertenece? (opcional)"
        maxLength={120}
      />
      <Textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Detalle opcional (qué vendes u ofreces)"
        rows={2}
        maxLength={600}
      />
      <div className="flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={submit}
          disabled={loading}
          className="bg-[#006c49] text-white hover:bg-[#00583b]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar solicitud"}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
          Cancelar
        </Button>
      </div>
    </div>
  )
}
