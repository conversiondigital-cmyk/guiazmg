// POST /api/mobile/v1/auth/forgot-password — envuelve
// `src/app/api/auth/forgot-password/route.ts` en el formato de respuesta del
// namespace móvil.
import type { NextRequest } from "next/server"
import { POST as webForgotPassword } from "@/app/api/auth/forgot-password/route"
import { ok, fail } from "@/lib/api/mobile/respond"

export async function POST(req: NextRequest) {
  const webResponse = await webForgotPassword(req)
  const body = await webResponse.json().catch(() => null)

  if (webResponse.status >= 200 && webResponse.status < 300) {
    return ok(body)
  }

  const message = typeof body?.error === "string" ? body.error : "No se pudo procesar la solicitud."

  if (webResponse.status === 404) {
    return fail("NOT_FOUND", 404, message)
  }
  if (webResponse.status === 429) {
    return fail("RATE_LIMITED", 429, message)
  }
  if (webResponse.status === 400) {
    return fail("VALIDATION_ERROR", 400, message)
  }
  return fail("INTERNAL_ERROR", 500, message)
}
