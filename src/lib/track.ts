"use client"

import { useCallback } from "react"

export function useTrackClick() {
  const track = useCallback(async (businessId: string, type: string) => {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, type }),
      })
    } catch {
      // silently fail
    }
  }, [])

  return { track }
}

export function useTrackView() {
  const trackView = useCallback(async (businessId: string) => {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, type: "view" }),
      })
    } catch {
      // silently fail
    }
  }, [])

  return { trackView }
}
