import { NextResponse } from "next/server"
import { getPublicAppUrl } from "@/lib/env"

const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [getPublicAppUrl()]
    : ["http://localhost:3100", getPublicAppUrl()]

export function corsHeaders(request: Request): Headers {
  const origin = request.headers.get("origin") || ""
  const isAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes("*")

  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Csrf-Token, X-Session-Id",
    "Access-Control-Max-Age": "86400",
  })

  if (isAllowed) {
    headers.set("Access-Control-Allow-Origin", origin)
  } else if (!origin) {
    headers.set("Access-Control-Allow-Origin", "*")
  }

  return headers
}

export function handleCors(request: Request): NextResponse | null {
  if (request.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders(request),
    })
  }
  return null
}
