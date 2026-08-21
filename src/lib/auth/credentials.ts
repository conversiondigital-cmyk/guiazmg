import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { getSettingBool } from "@/lib/settings"

// Hash bcrypt señuelo (cost 12) para igualar el tiempo de respuesta cuando el
// usuario no existe. No corresponde a ninguna contraseña real.
const DUMMY_PASSWORD_HASH = "$2b$12$uRphXMYHux6pAwSgj/kRPeYQW.pIZ7BwiOzs5QsKXN2A3tTgl9ALq"

// Extraído TEXTUALMENTE del `authorize` de Credentials en `src/lib/auth.ts`
// (Fase B0 de la API móvil: el login por email/password de la app nativa
// necesita la MISMA validación que el login web, sin duplicarla). Es un
// movimiento puro, no una reescritura: cualquier diferencia de comportamiento
// entre este archivo y el `authorize` original de antes de moverlo sería un
// bug, no una mejora.
export async function verifyCredentials(email: string, password: string) {
  const normalizedEmail = String(email).toLowerCase()

  // El rate-limiting del login lo aplica el proxy (una sola vez por POST) sobre
  // /api/auth/callback/credentials. Antes se repetía aquí con las MISMAS llaves,
  // así que cada intento contaba DOBLE y bloqueaba al usuario tras ~2-3 intentos
  // aunque la contraseña fuera correcta ("No se pudo iniciar sesión"). Se quitó
  // el duplicado; el proxy sigue protegiendo contra fuerza bruta.
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  // SEGURIDAD (fix enumeración por timing): si el usuario no existe o no tiene
  // hash, hacer igual un bcrypt.compare contra un hash señuelo de MISMO costo
  // (cost 12) para que el tiempo de respuesta no delate qué correos existen.
  // Antes, un correo inexistente respondía en ~10ms (sin bcrypt) vs ~300ms para
  // uno existente con mala contraseña: un oráculo de enumeración trivial.
  if (!user || !user.passwordHash || !user.isActive) {
    await bcrypt.compare(password as string, DUMMY_PASSWORD_HASH)
    return null
  }

  const isValid = await bcrypt.compare(
    password as string,
    user.passwordHash
  )

  if (!isValid) return null

  // Verificación de correo (solo si el admin la activó). Google no pasa
  // por aquí, se auto-verifica. Sin verificar → no se puede entrar.
  const requireVerification = await getSettingBool("require_email_verification")
  if (requireVerification && !user.emailVerified) return null

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    sessionVersion: user.sessionVersion,
  }
}
