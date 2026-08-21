// Ruta de prueba del guard móvil (B0). Su único propósito hoy es demostrar
// que el proxy ya no le devuelve HTML de /auth/login a un cliente nativo:
// sin `Authorization: Bearer`, debe responder 401 JSON con
// `code: "UNAUTHENTICATED"`. La verificación real de sesión llega en B1.
import type { NextRequest } from "next/server"
import { requireMobileAuth } from "@/lib/api/mobile/guard"
import { ok } from "@/lib/api/mobile/respond"

export async function GET(req: NextRequest) {
  const auth = await requireMobileAuth(req)
  if (!auth.ok) return auth.response

  return ok({ userId: auth.auth.userId, role: auth.auth.role ?? null })
}
