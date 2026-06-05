"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export function ClaimButton({ businessId, businessName }: { businessId: string; businessName: string }) {
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  if (!session) return null

  const handleClaim = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/business/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, message: message || undefined }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Error al solicitar")
        return
      }
      toast.success("Solicitud enviada. El administrador revisará tu petición.")
      setOpen(false)
    } catch {
      toast.error("Error al enviar solicitud")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        ¿Eres el dueño? Reclama este negocio
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reclamar {businessName}</DialogTitle>
            <DialogDescription>
              Envíanos un mensaje y verificaremos que eres el propietario para asignarte el control.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Opcional: dinos cómo podemos verificar que eres el dueño..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleClaim} disabled={loading}>
              {loading ? "Enviando..." : "Enviar solicitud"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
