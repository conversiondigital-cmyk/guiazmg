import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret) throw new Error("ENCRYPTION_KEY environment variable is required")
  const key = Buffer.from(secret, "hex")
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be a 32-byte hex string (64 hex chars)")
  return key
}

export function encrypt(text: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  const authTag = cipher.getAuthTag().toString("hex")
  return `${iv.toString("hex")}:${authTag}:${encrypted}`
}

export function decrypt(encrypted: string): string {
  const key = getKey()
  const parts = encrypted.split(":")
  if (parts.length !== 3) throw new Error("Invalid encrypted text format")
  const [ivHex, authTagHex, ciphertext] = parts
  const iv = Buffer.from(ivHex, "hex")
  const authTag = Buffer.from(authTagHex, "hex")
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  let decrypted = decipher.update(ciphertext, "hex", "utf8")
  decrypted += decipher.final("utf8")
  return decrypted
}
