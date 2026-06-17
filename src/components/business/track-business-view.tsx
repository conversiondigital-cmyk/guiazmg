"use client"

import { useEffect, useRef } from "react"
import { trackEvent } from "@/lib/analytics/track"

// Registra una vista del perfil (BUSINESS_VIEW) una sola vez al montar.
export function TrackBusinessView({ businessId }: { businessId: string }) {
  const fired = useRef(false)
  useEffect(() => {
    if (fired.current || !businessId) return
    fired.current = true
    trackEvent("BUSINESS_VIEW", { businessId })
  }, [businessId])
  return null
}
