import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import { getPublicAppUrl } from "@/lib/env"

// Tokens de CAMBIO de correo. Reutilizan la tabla verification_tokens con un
// prefijo propio que codifica el usuario y el correo nuevo, para no chocar con los
// tokens de verificación de alta ("verify:") ni de reset de contraseña.
// identifier = "changeemail:<userId>:<nuevoCorreo>"
const PREFIX = "changeemail:"
const TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

export async function createEmailChangeToken(userId: string, newEmail: string): Promise<string> {
  const identifier = `${PREFIX}${userId}:${newEmail.toLowerCase()}`
  await prisma.verificationToken.deleteMany({ where: { identifier } })
  const token = crypto.randomBytes(32).toString("hex")
  await prisma.verificationToken.create({
    data: { identifier, token, expires: new Date(Date.now() + TTL_MS) },
  })
  return `${getPublicAppUrl()}/api/user/verify-email-change?token=${token}`
}

// Consume el token (un solo uso): devuelve { userId, newEmail } si es válido y no
// expiró, o null. Siempre borra el token encontrado.
export async function consumeEmailChangeToken(
  token: string,
): Promise<{ userId: string; newEmail: string } | null> {
  if (!token) return null
  const row = await prisma.verificationToken.findFirst({
    where: { token, identifier: { startsWith: PREFIX } },
  })
  if (!row) return null
  await prisma.verificationToken.deleteMany({ where: { identifier: row.identifier } })
  if (row.expires < new Date()) return null
  // El userId (cuid) y el correo no contienen ":"; el primer ":" separa ambos.
  const rest = row.identifier.slice(PREFIX.length)
  const sep = rest.indexOf(":")
  if (sep < 0) return null
  return { userId: rest.slice(0, sep), newEmail: rest.slice(sep + 1) }
}
