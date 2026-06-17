"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BadgeCheck, ShieldX, Zap, ClipboardCheck, Loader2, MapPin, Phone } from "lucide-react"
import { confirmDialog } from "@/components/ui/system-dialog"
import type { VerificationMode } from "@/lib/verification-config"

interface PendingItem {
  id: string
  name: string
  slug: string
  phone: string | null
  address: string | null
  municipality: string | null
  ownerEmail: string | null
  ownerName: string | null
}

export function VerificacionesClient({
  initialMode,
  pending,
}: {
  initialMode: VerificationMode
  pending: PendingItem[]
}) {
  const router = useRouter()
  const [mode, setMode] = useState<VerificationMode>(initialMode)
  const [savingMode, setSavingMode] = useState(false)
  const [items, setItems] = useState<PendingItem[]>(pending)
  const [busy, setBusy] = useState<string | null>(null)

  async function changeMode(next: VerificationMode) {
    if (next === mode) return
    setSavingMode(true)
    const prev = mode
    setMode(next)
    try {
      const res = await fetch("/api/admin/verification-mode", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: next }),
      })
      if (!res.ok) {
        setMode(prev)
        toast.error("No se pudo cambiar el método")
        return
      }
      toast.success(next === "manual" ? "Método manual activado" : "Método rápido activado")
      router.refresh()
    } finally {
      setSavingMode(false)
    }
  }

  async function act(id: string, action: "VERIFY" | "VERIFY_REJECT") {
    if (action === "VERIFY_REJECT") {
      const ok = await confirmDialog({
        title: "Rechazar verificación",
        description: "El dueño será notificado y podrá volver a solicitarla.",
        destructive: true,
      })
      if (!ok) return
    }
    setBusy(id)
    try {
      const res = await fetch(`/api/admin/businesses/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) {
        toast.error("No se pudo procesar")
        return
      }
      setItems((prev) => prev.filter((i) => i.id !== id))
      toast.success(action === "VERIFY" ? "Negocio verificado" : "Solicitud rechazada")
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  const ModeButton = ({ value, icon, title, desc }: { value: VerificationMode; icon: React.ReactNode; title: string; desc: string }) => (
    <button
      type="button"
      onClick={() => changeMode(value)}
      disabled={savingMode}
      className={`flex-1 rounded-xl border-2 p-4 text-left transition-colors disabled:opacity-60 ${
        mode === value ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="flex items-center gap-2 font-semibold text-gray-900">
        {icon}
        {title}
        {mode === value && <BadgeCheck className="ml-auto h-5 w-5 text-green-600" />}
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </button>
  )

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Método de verificación</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <ModeButton
            value="quick"
            icon={<Zap className="h-5 w-5 text-green-700" />}
            title="Rápida"
            desc="Tú marcas verificado directamente desde cada negocio. Sin solicitudes."
          />
          <ModeButton
            value="manual"
            icon={<ClipboardCheck className="h-5 w-5 text-green-700" />}
            title="Manual"
            desc="El dueño solicita la verificación y tú la apruebas o rechazas desde la cola de abajo."
          />
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-3 text-lg font-semibold">
          Solicitudes pendientes {items.length > 0 && <span className="text-muted-foreground">({items.length})</span>}
        </h2>
        {items.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center text-sm text-muted-foreground">
            {mode === "manual"
              ? "No hay solicitudes pendientes por ahora."
              : "Estás en modo rápido. Verifica los negocios directamente desde su ficha en Negocios."}
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <Card key={it.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <a
                      href={`/perfil/${it.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-gray-900 hover:text-green-700 hover:underline"
                    >
                      {it.name}
                    </a>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {it.municipality && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {it.municipality}
                        </span>
                      )}
                      {it.phone && (
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {it.phone}
                        </span>
                      )}
                      {it.ownerEmail && <span>Dueño: {it.ownerEmail}</span>}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => act(it.id, "VERIFY_REJECT")}
                      disabled={busy === it.id}
                    >
                      <ShieldX className="h-4 w-4 text-red-600" /> Rechazar
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-700 hover:bg-green-800"
                      onClick={() => act(it.id, "VERIFY")}
                      disabled={busy === it.id}
                    >
                      {busy === it.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                      Aprobar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
