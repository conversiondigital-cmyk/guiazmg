"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Check, Loader2 } from "@/lib/icons"
import { useState } from "react"

interface Settings {
  emailNotifications?: boolean
  pushNotifications?: boolean
  marketingEmails?: boolean
}

export function NotificationPreferencesForm({ settings, userId }: { settings: Settings | null; userId: string }) {
  const [prefs, setPrefs] = useState({
    emailNotifications: settings?.emailNotifications ?? true,
    pushNotifications: settings?.pushNotifications ?? true,
    marketingEmails: settings?.marketingEmails ?? false,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const toggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, preferences: prefs }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  const items = [
    { key: "emailNotifications" as const, label: "Notificaciones por correo" },
    { key: "pushNotifications" as const, label: "Notificaciones push" },
    { key: "marketingEmails" as const, label: "Correos promocionales" },
  ]

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <Label htmlFor={item.key} className="text-sm text-gray-700 cursor-pointer">
              {item.label}
            </Label>
            <button
              id={item.key}
              onClick={() => toggle(item.key)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                prefs[item.key] ? "bg-green-700" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  prefs[item.key] ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      <Button onClick={handleSave} disabled={saving}>
        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
        {saved ? "Guardado" : "Guardar preferencias"}
      </Button>
    </div>
  )
}
