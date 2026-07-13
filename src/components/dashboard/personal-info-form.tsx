"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
  const [name, setName] = useState(initialName)
  const [saving, setSaving] = useState(false)
  const dirty = name.trim() !== initialName.trim()

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
          <div className="mt-1.5 flex h-9 items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
            {email}
          </div>
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
