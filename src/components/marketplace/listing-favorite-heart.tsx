"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Heart } from "@/lib/icons"
import { toast } from "sonner"

// Corazón de "Guardar" para las tarjetas del listado. Va como overlay sobre la
// imagen (fuera del <Link>); al hacer clic NO navega a la publicación. Sin sesión,
// manda a login. Al guardar, el API notifica al vendedor.
export function ListingFavoriteHeart({
  listingId,
  isAuthed,
  initialFavorited = false,
  className = "",
}: {
  listingId: string
  isAuthed: boolean
  initialFavorited?: boolean
  className?: string
}) {
  const router = useRouter()
  const [favorited, setFavorited] = useState(initialFavorited)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isAuthed || initialFavorited) return
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
  }, [listingId, isAuthed, initialFavorited])

  const toggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!isAuthed) {
      const cb =
        typeof window !== "undefined" ? window.location.pathname + window.location.search : "/marketplace"
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(cb)}`)
      return
    }
    if (busy) return
    setBusy(true)
    const next = !favorited
    setFavorited(next)
    try {
      const res = await fetch(`/api/marketplace/${listingId}/favorite`, { method: next ? "POST" : "DELETE" })
      if (!res.ok) {
        setFavorited(!next)
        if (res.status === 401) router.push("/auth/login")
        else toast.error("No se pudo guardar")
      }
    } catch {
      setFavorited(!next)
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
      aria-label={favorited ? "Quitar de guardados" : "Guardar"}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow ring-1 ring-black/5 transition hover:bg-white ${className}`}
    >
      <Heart className={`h-4 w-4 ${favorited ? "fill-red-500 text-red-500" : "text-gray-600"}`} />
    </button>
  )
}
