"use client"

import { useEffect } from "react"

// Envía UNA visita por sesión (la de entrada) con referrer + UTM, para analítica
// de fuentes de tráfico. Fire-and-forget; nunca bloquea la navegación.
export function TrafficBeacon() {
  useEffect(() => {
    try {
      const KEY = "zmg_visit_sent"
      if (sessionStorage.getItem(KEY)) return
      sessionStorage.setItem(KEY, "1")

      const params = new URLSearchParams(window.location.search)
      const payload = JSON.stringify({
        path: window.location.pathname,
        referrer: document.referrer || null,
        utmSource: params.get("utm_source"),
        utmMedium: params.get("utm_medium"),
        utmCampaign: params.get("utm_campaign"),
      })
      const url = "/api/analytics/visit"

      if (navigator.sendBeacon) {
        navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }))
      } else {
        fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(() => {})
      }
    } catch {
      // sin analítica si algo falla
    }
  }, [])

  return null
}
