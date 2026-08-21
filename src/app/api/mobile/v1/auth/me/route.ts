// GET /api/mobile/v1/auth/me — perfil fresco del usuario autenticado. Requiere
// Bearer access token válido (ver `src/lib/api/mobile/guard.ts`).
import type { NextRequest } from "next/server"
import { requireMobileAuth } from "@/lib/api/mobile/guard"
import { ok, fail } from "@/lib/api/mobile/respond"
import { prisma } from "@/lib/prisma"

export async function GET(req: NextRequest) {
  const auth = await requireMobileAuth(req)
  if (!auth.ok) return auth.response

  const user = await prisma.user.findUnique({
    where: { id: auth.auth.userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      acceptedTermsAt: true,
      _count: { select: { businesses: true, notifications: true } },
    },
  })

  if (!user) {
    return fail("UNAUTHENTICATED", 401, "El usuario ya no existe.")
  }

  const unreadNotifications = await prisma.notification.count({
    where: { userId: auth.auth.userId, isRead: false },
  })

  return ok({
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    acceptedTerms: !!user.acceptedTermsAt,
    hasBusiness: user._count.businesses > 0,
    unreadNotifications,
  })
}
