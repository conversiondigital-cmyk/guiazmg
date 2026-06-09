"use client"

import { useEffect } from "react"

export function ViewCounter({ postId }: { postId: string }) {
  useEffect(() => {
    // Fire-and-forget — Redis debounces per IP per 24h
    fetch(`/api/blog/posts/${postId}/view`, { method: "POST" }).catch(() => {})
  }, [postId])

  return null
}
