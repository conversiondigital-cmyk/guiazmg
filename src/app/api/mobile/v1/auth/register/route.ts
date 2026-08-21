// POST /api/mobile/v1/auth/register — envuelve
// `src/app/api/auth/register/route.ts` (mismo flujo de alta que la web, misma
// validación, mismas 3 fechas de consentimiento OBLIGATORIAS) pero responde en
// el formato `{ ok, data }` / `{ ok:false, error }` del namespace móvil.
import type { NextRequest } from "next/server"
import { POST as webRegister } from "@/app/api/auth/register/route"
import { ok, fail } from "@/lib/api/mobile/respond"

export async function POST(req: NextRequest) {
  const webResponse = await webRegister(req)
  const body = await webResponse.json().catch(() => null)

  if (webResponse.status >= 200 && webResponse.status < 300) {
    return ok(body)
  }

  const message = typeof body?.error === "string" ? body.error : "No se pudo completar el registro."

  if (webResponse.status === 409) {
    return fail("CONFLICT", 409, message)
  }
  if (webResponse.status === 400) {
    return fail("VALIDATION_ERROR", 400, message)
  }
  if (webResponse.status === 429) {
    return fail("RATE_LIMITED", 429, message)
  }
  return fail("INTERNAL_ERROR", 500, message)
}
