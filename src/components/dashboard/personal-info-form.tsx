"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "@/lib/icons"
import { toast } from "sonner"

export function PersonalInfoForm({
  initialName,
  email,
  memberSince,
}: {
  initialName: string
  email: string
  memberSince: string
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const dirty = name.trim() !== initialName.trim()

  // Cambio de correo (con verificación del correo nuevo).
  const [editingEmail, setEditingEmail] = useState(false)
  const [newEmail, setNewEmail] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)

  // Avisos al volver del enlace de confirmación.
  useEffect(() => {
    if (searchParams.get("email_changed") === "1") {
      toast.success("Correo actualizado. Úsalo para iniciar sesión.")
      router.replace("/cuenta/configuracion")
    }
    const err = searchParams.get("email_error")
    if (err) {
      const msg =
        err === "taken"
          ? "Ese correo ya está en uso por otra cuenta."
          : err === "token"
            ? "El enlace es inválido o ya expiró. Solicita el cambio de nuevo."
            : "No se pudo cambiar el correo. Inténtalo de nuevo."
      toast.error(msg)
      router.replace("/cuenta/configuracion")
    }
  }, [searchParams, router])

  const save = async () => {
    if (!name.trim()) {
      toast.error("El nombre no puede estar vacío")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "No se pudo guardar")
        return
      }
      toast.success("Nombre actualizado")
      router.refresh()
    } catch {
      toast.error("No se pudo guardar")
    } finally {
      setSaving(false)
    }
  }

  const requestEmailChange = async () => {
    const value = newEmail.trim().toLowerCase()
    if (!value) {
      toast.error("Escribe el correo nuevo")
      return
    }
    setSendingEmail(true)
    try {
      const res = await fetch("/api/user/change-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error || "No se pudo procesar")
        return
      }
      toast.success(data.message || "Te enviamos un enlace de confirmación al correo nuevo.")
      setEditingEmail(false)
      setNewEmail("")
    } catch {
      toast.error("No se pudo procesar")
    } finally {
      setSendingEmail(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="name" className="text-xs font-semibold text-gray-500">
            Nombre
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            placeholder="Tu nombre"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label className="text-xs font-semibold text-gray-500">Correo electrónico</Label>
          {editingEmail ? (
            <div className="mt-1.5 space-y-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nuevo@correo.com"
                maxLength={160}
                autoComplete="email"
              />
              <p className="text-[11px] text-gray-500">
                Te enviaremos un enlace al correo nuevo. El cambio solo se aplica al confirmarlo.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={requestEmailChange} disabled={sendingEmail}>
                  {sendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Enviar verificación
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditingEmail(false)
                    setNewEmail("")
                  }}
                  disabled={sendingEmail}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex h-9 flex-1 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                {email}
              </div>
              <Button size="sm" variant="outline" onClick={() => setEditingEmail(true)}>
                Cambiar
              </Button>
            </div>
          )}
        </div>
      </div>
      <div className="sm:max-w-[calc(50%-0.5rem)]">
        <Label className="text-xs font-semibold text-gray-500">Miembro desde</Label>
        <div className="mt-1.5 flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-400">
          {memberSince}
        </div>
      </div>
      <Button onClick={save} disabled={saving || !dirty}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
        Guardar cambios
      </Button>
    </div>
  )
}
