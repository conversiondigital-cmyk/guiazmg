import type { AnalyticsEventType } from "@/lib/analytics/events"

interface TrackPayload {
  businessId?: string
  listingId?: string
  marketplaceListingId?: string
  metadata?: Record<string, unknown>
}

// Envía un evento de analítica desde el cliente sin bloquear la navegación.
// Usa sendBeacon (sobrevive al cambio de página al hacer clic en un enlace
// externo/tel:) y cae a fetch keepalive si no está disponible.
export function trackEvent(eventType: AnalyticsEventType, payload: TrackPayload = {}): void {
  try {
    const body = JSON.stringify({ eventType, ...payload })
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([body], { type: "application/json" })
      navigator.sendBeacon("/api/analytics", blob)
      return
    }
    if (typeof fetch === "function") {
      fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // nunca debe romper la UI
  }
}
