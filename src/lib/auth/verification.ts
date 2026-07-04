import crypto from "node:crypto"
import { prisma } from "@/lib/prisma"
import { getPublicAppUrl } from "@/lib/env"

// Tokens de verificación de correo. Reutiliza la tabla verification_tokens pero
// con identifier prefijado ("verify:<email>") para NO chocar con los tokens de
// reset de contraseña (que usan identifier = email a secas).
const PREFIX = "verify:"
const TTL_MS = 24 * 60 * 60 * 1000 // 24 horas

export async function createVerificationToken(email: string): Promise<string> {
  const identifier = PREFIX + email.toLowerCase()
  await prisma.verificationToken.deleteMany({ where: { identifier } })
  const token = crypto.randomBytes(32).toString("hex")
  await prisma.verificationToken.create({
    data: { identifier, token, expires: new Date(Date.now() + TTL_MS) },
  })
  return `${getPublicAppUrl()}/api/auth/verify?token=${token}`
}

// Consume un token: devuelve el email si es válido y no expiró (y lo borra), o
// null. Borra siempre el token encontrado (un solo uso).
export async function consumeVerificationToken(token: string): Promise<string | null> {
  if (!token) return null
  const row = await prisma.verificationToken.findFirst({
    where: { token, identifier: { startsWith: PREFIX } },
  })
  if (!row) return null
  await prisma.verificationToken.deleteMany({ where: { identifier: row.identifier } })
  if (row.expires < new Date()) return null
  return row.identifier.slice(PREFIX.length)
}
