"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "@/lib/icons"
import { toast } from "sonner"

// Botón "Guardar" de una publicación del marketplace. Al guardarla, el API avisa al
// vendedor ("Guardaron tu publicación"). Optimista; si no hay sesión, manda a login.
export function ListingFavoriteButton({ listingId }: { listingId: string }) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    fetch(`/api/marketplace/${listingId}/favorite`)
      .then((r) => r.json())
      .then((d) => {
        if (active) setFavorited(!!d.favorited)
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [listingId])

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    const next = !favorited
    setFavorited(next) // optimista
    try {
      const res = await fetch(`/api/marketplace/${listingId}/favorite`, {
        method: next ? "POST" : "DELETE",
      })
      if (res.status === 401) {
        setFavorited(false)
        toast.error("Inicia sesión para guardar publicaciones")
        router.push("/auth/login")
        return
      }
      if (!res.ok) {
        setFavorited(!next)
        toast.error("No se pudo guardar")
        return
      }
      if (next) toast.success("Guardado en tus favoritos")
    } catch {
      setFavorited(!next)
      toast.error("Error de conexión")
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={favorited}
      className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
        favorited
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-gray-200 text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Heart className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : ""}`} />
      {favorited ? "Guardado" : "Guardar"}
    </button>
  )
}
