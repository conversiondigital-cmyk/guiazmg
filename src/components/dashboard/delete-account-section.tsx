"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle } from "@/lib/icons"
import { toast } from "sonner"

// Zona de eliminación de cuenta. El usuario borra sus datos personales de forma
// permanente: la cuenta se desactiva, se anonimizan nombre/foto/contraseña y se
// libera el correo. Requiere escribir ELIMINAR para evitar borrados accidentales.
const CONFIRM_WORD = "ELIMINAR"

export function DeleteAccountSection() {
  const [open, setOpen] = useState(false)
  const [confirm, setConfirm] = useState("")
  const [deleting, setDeleting] = useState(false)

  const doDelete = async () => {
    if (confirm.trim().toUpperCase() !== CONFIRM_WORD) return
    setDeleting(true)
    try {
      const res = await fetch("/api/user/delete-account", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "No se pudo eliminar la cuenta")
        setDeleting(false)
        return
      }
      toast.success("Cuenta eliminada. Cerrando sesión…")
      await signOut({ callbackUrl: "/" })
    } catch {
      toast.error("No se pudo eliminar la cuenta")
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Esta acción es <strong>permanente</strong>. Se eliminan tus datos personales (nombre, foto y
        contraseña), se libera tu correo y se cierra tu cuenta. No podrás recuperarla.
      </p>

      {!open ? (
        <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" onClick={() => setOpen(true)}>
          <AlertTriangle className="mr-2 h-4 w-4" />
          Eliminar mi cuenta
        </Button>
      ) : (
        <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 space-y-3">
          <p className="text-sm text-gray-700">
            Para confirmar, escribe <strong>{CONFIRM_WORD}</strong> abajo:
          </p>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={CONFIRM_WORD}
            className="max-w-xs uppercase"
            autoComplete="off"
          />
          <div className="flex gap-2">
            <Button
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting || confirm.trim().toUpperCase() !== CONFIRM_WORD}
              onClick={doDelete}
            >
              {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Eliminar definitivamente
            </Button>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => {
                setOpen(false)
                setConfirm("")
              }}
            >
              Cancelar
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
