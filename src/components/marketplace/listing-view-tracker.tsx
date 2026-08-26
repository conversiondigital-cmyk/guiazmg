"use client"

import { useEffect } from "react"

// Registra una vista de la publicación al montar. Fire-and-forget: Redis hace
// debounce por IP cada 24 h. Solo se monta para visitantes que NO son el dueño
// ni admin (ver la página de detalle), para no inflar el contador.
export function ListingViewTracker({ listingId }: { listingId: string }) {
  useEffect(() => {
    fetch(`/api/marketplace/${listingId}/view`, { method: "POST" }).catch(() => {})
  }, [listingId])

  return null
}
