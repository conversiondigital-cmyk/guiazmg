"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

const KEY = "guiazmg-cookie-consent"

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(localStorage.getItem(KEY) !== "accepted")
  }, [])

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background/95 backdrop-blur px-4 py-3 shadow-lg">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Usamos cookies para sesión, seguridad, preferencias y analítica. Consulta nuestra <Link href="/politica-cookies" className="underline">política de cookies</Link>.
        </p>
        <Button size="sm" onClick={() => { localStorage.setItem(KEY, "accepted"); setVisible(false) }}>
          Aceptar
        </Button>
      </div>
    </div>
  )
}
