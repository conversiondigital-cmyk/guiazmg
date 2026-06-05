"use client"

import { useCallback } from "react"
import type { AnalyticsEventType } from "./events"

export function useAnalytics() {
  const track = useCallback(async (eventType: AnalyticsEventType, data?: any) => {
    try {
      await fetch("/api/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, ...data }),
      })
    } catch {
    }
  }, [])

  return { track }
}
