"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "@/lib/icons"
import { useState } from "react"

export function SecuritySection({ userId }: { userId: string }) {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) return
    if (newPassword.length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres")
      return
    }
    setSaving(true)
    setMessage("")
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, currentPassword, newPassword }),
      })
      if (res.ok) {
        setMessage("Contraseña actualizada correctamente")
        setCurrentPassword("")
        setNewPassword("")
      } else {
        const data = await res.json()
        setMessage(data.error || "Error al cambiar la contraseña")
      }
    } catch {
      setMessage("Error de conexión")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="current-password">Contraseña actual</Label>
          <Input
            id="current-password"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="new-password">Nueva contraseña</Label>
          <Input
            id="new-password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={handleChangePassword} disabled={saving || !currentPassword || !newPassword}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
        Cambiar contraseña
      </Button>
      {message && (
        <p className={`text-xs ${message.includes("actualizada") ? "text-green-600" : "text-red-600"}`}>
          {message}
        </p>
      )}
    </div>
  )
}
