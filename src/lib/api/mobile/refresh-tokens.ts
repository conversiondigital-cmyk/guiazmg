// Ciclo de vida del refresh token opaco de la API móvil (tabla
// `mobile_refresh_tokens`, modelo `MobileRefreshToken`). Toda la lógica de
// rotación y detección de reuso vive aquí para que `auth/login` y
// `auth/refresh` no dupliquen las reglas.
import { prisma } from "@/lib/prisma"
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_MS,
  generateOpaqueRefreshToken,
  hashRefreshToken,
  newFamilyId,
  signMobileAccessToken,
} from "./tokens"

export interface DeviceInfo {
  deviceId?: string | null
  platform?: string | null
  appVersion?: string | null
  userAgent?: string | null
  ip?: string | null
}

export interface UserForToken {
  id: string
  email: string
  role: string
  sessionVersion: number
  acceptedTermsAt: Date | null
}

export interface IssuedTokenPair {
  accessToken: string
  expiresIn: number
  refreshToken: string
  refreshExpiresAt: Date
}

async function issueAccessToken(user: UserForToken): Promise<string> {
  return signMobileAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    sv: user.sessionVersion,
    act: !!user.acceptedTermsAt,
  })
}

// Emite un par access+refresh NUEVO en una familia NUEVA. Se usa en /login
// (cada login inicia su propia cadena de rotación, independiente de otros
// dispositivos ya logueados).
export async function issueTokenPair(user: UserForToken, device: DeviceInfo): Promise<IssuedTokenPair> {
  const refreshToken = generateOpaqueRefreshToken()
  const refreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

  await prisma.mobileRefreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashRefreshToken(refreshToken),
      familyId: newFamilyId(),
      deviceId: device.deviceId ?? null,
      platform: device.platform ?? null,
      appVersion: device.appVersion ?? null,
      userAgent: device.userAgent ?? null,
      ip: device.ip ?? null,
      expiresAt: refreshExpiresAt,
      lastUsedAt: new Date(),
    },
  })

  return {
    accessToken: await issueAccessToken(user),
    expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshToken,
    refreshExpiresAt,
  }
}

export type RotateRefreshTokenResult =
  | { ok: true; pair: IssuedTokenPair; userId: string }
  | { ok: false; code: "INVALID_REFRESH" | "REFRESH_EXPIRED" | "REFRESH_REUSED" | "SESSION_REVOKED" }

// Revoca TODA la familia (usada cuando se detecta reuso de un refresh ya
// rotado, o cuando el usuario dueño del token dejó de ser válido a mitad de la
// cadena — cuenta desactivada/borrada/sessionVersion cambiada).
async function revokeFamily(familyId: string): Promise<void> {
  await prisma.mobileRefreshToken.updateMany({
    where: { familyId, revokedAt: null },
    data: { revokedAt: new Date() },
  })
}

// Rota un refresh token: valida, detecta reuso, revoca el viejo y crea el
// nuevo dentro de la misma familia. Devuelve un código de error específico en
// cada rama para que la ruta pueda mapear al `MobileErrorCode` correcto.
export async function rotateRefreshToken(
  refreshTokenPlain: string,
  device: DeviceInfo
): Promise<RotateRefreshTokenResult> {
  const tokenHash = hashRefreshToken(refreshTokenPlain)

  const existing = await prisma.mobileRefreshToken.findUnique({ where: { tokenHash } })
  if (!existing) {
    return { ok: false, code: "INVALID_REFRESH" }
  }

  if (existing.revokedAt) {
    // Reuso de un token ya rotado/revocado: alguien más (o el dispositivo
    // original tras robo) intenta usar un refresh muerto. Se mata la familia
    // ENTERA — es lo que hace aceptable que el refresh viva en el teléfono.
    await revokeFamily(existing.familyId)
    return { ok: false, code: "REFRESH_REUSED" }
  }

  if (existing.expiresAt.getTime() < Date.now()) {
    return { ok: false, code: "REFRESH_EXPIRED" }
  }

  const user = await prisma.user.findUnique({
    where: { id: existing.userId },
    select: { id: true, email: true, role: true, isActive: true, deletedAt: true, sessionVersion: true, acceptedTermsAt: true },
  })

  if (!user || !user.isActive || user.deletedAt) {
    await revokeFamily(existing.familyId)
    return { ok: false, code: "SESSION_REVOKED" }
  }

  const newRefreshToken = generateOpaqueRefreshToken()
  const newRefreshExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS)

  const accessToken = await issueAccessToken(user)

  await prisma.$transaction(async (tx) => {
    const created = await tx.mobileRefreshToken.create({
      data: {
        userId: user.id,
        tokenHash: hashRefreshToken(newRefreshToken),
        familyId: existing.familyId,
        deviceId: device.deviceId ?? existing.deviceId,
        platform: device.platform ?? existing.platform,
        appVersion: device.appVersion ?? existing.appVersion,
        userAgent: device.userAgent ?? existing.userAgent,
        ip: device.ip ?? existing.ip,
        expiresAt: newRefreshExpiresAt,
        lastUsedAt: new Date(),
      },
    })

    await tx.mobileRefreshToken.update({
      where: { id: existing.id },
      data: { revokedAt: new Date(), replacedById: created.id },
    })
  })

  return {
    ok: true,
    userId: user.id,
    pair: {
      accessToken,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
      refreshToken: newRefreshToken,
      refreshExpiresAt: newRefreshExpiresAt,
    },
  }
}

// Revoca la familia completa dueña de un refresh dado (logout explícito). No
// distingue "no existe" de "ya estaba revocado": el logout siempre responde
// 204 desde la ruta, esto solo intenta limpiar lo que encuentre.
export async function revokeRefreshTokenFamily(refreshTokenPlain: string): Promise<void> {
  const tokenHash = hashRefreshToken(refreshTokenPlain)
  const existing = await prisma.mobileRefreshToken.findUnique({ where: { tokenHash } })
  if (!existing) return
  await revokeFamily(existing.familyId)
}
