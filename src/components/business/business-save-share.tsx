"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Heart, Share2 } from "lucide-react"
import { toast } from "sonner"

// Botones "Guardar" (favorito) y "Compartir" para el perfil público. El estado de
// favorito se consulta en el cliente (la página es ISR/cacheada, no por usuario).
export function BusinessSaveShare({ businessId, businessName }: { businessId: string; businessName: string }) {
  const { status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [fav, setFav] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (status !== "authenticated") return
    let cancelled = false
    fetch(`/api/favorites?businessId=${businessId}`)
      .then((r) => r.json())
      .then((d) => !cancelled && setFav(!!d.favorited))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [status, businessId])

  const toggle = async () => {
    if (status !== "authenticated") {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(pathname)}`)
      return
    }
    setBusy(true)
    const next = !fav
    setFav(next) // optimista
    try {
      const res = await fetch("/api/favorites", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      })
      if (!res.ok) throw new Error()
      toast.success(next ? "Guardado en favoritos" : "Quitado de favoritos")
    } catch {
      setFav(!next) // revertir si falla
      toast.error("No se pudo actualizar")
    } finally {
      setBusy(false)
    }
  }

  const share = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title: businessName, url })
      } else if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(url)
        toast.success("Enlace copiado")
      }
    } catch {
      /* el usuario canceló el diálogo de compartir */
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        aria-pressed={fav}
        className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
          fav ? "border-rose-200 bg-rose-50 text-rose-600" : "border-border bg-background hover:bg-muted"
        }`}
      >
        <Heart className={`h-4 w-4 ${fav ? "fill-rose-500 text-rose-500" : ""}`} />
        {fav ? "Guardado" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
      >
        <Share2 className="h-4 w-4" />
        Compartir
      </button>
    </div>
  )
}
