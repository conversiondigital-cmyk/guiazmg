// POST /api/mobile/v1/webview-session — emite un código opaco de un solo uso
// (TTL 60s) para abrir una pantalla del sitio web dentro de un WebView ya
// autenticado (handoff app→web). El consumidor del código (`/auth/handoff`,
// página del sitio web) es de la Fase A2 y NO se construye aquí — solo el
// emisor y `consumeWebViewCode` (reutilizable) que lo quema.
import type { NextRequest } from "next/server"
import { requireMobileAuth } from "@/lib/api/mobile/guard"
import { ok } from "@/lib/api/mobile/respond"
import { issueWebViewCode } from "@/lib/api/mobile/webview-session"

export async function POST(req: NextRequest) {
  const auth = await requireMobileAuth(req)
  if (!auth.ok) return auth.response

  const { code, expiresIn } = await issueWebViewCode(auth.auth.userId)

  return ok({ code, expiresIn })
}
