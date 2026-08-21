// POST /api/mobile/v1/auth/logout — revoca la familia completa del refresh
// token entregado (logout de ESE dispositivo/cadena, no de todos los
// dispositivos del usuario — para eso existe bumpear `sessionVersion`).
import type { NextRequest } from "next/server"
import { z } from "zod"
import { fail } from "@/lib/api/mobile/respond"
import { requireMobileAuth } from "@/lib/api/mobile/guard"
import { revokeRefreshTokenFamily } from "@/lib/api/mobile/refresh-tokens"

const logoutSchema = z.object({
  refreshToken: z.string().trim().min(1),
})

export async function POST(req: NextRequest) {
  const auth = await requireMobileAuth(req)
  if (!auth.ok) return auth.response

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return fail("VALIDATION_ERROR", 400, "El cuerpo debe ser JSON válido.")
  }

  const parsed = logoutSchema.safeParse(body)
  if (!parsed.success) {
    return fail("VALIDATION_ERROR", 400, "Datos inválidos.", parsed.error.flatten())
  }

  await revokeRefreshTokenFamily(parsed.data.refreshToken)

  return new Response(null, { status: 204 })
}
