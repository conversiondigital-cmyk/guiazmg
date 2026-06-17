import { prisma } from "@/lib/prisma"

// Método de verificación de negocios:
//  - "quick"  : el admin marca verificado directamente desde el negocio.
//  - "manual" : el dueño solicita verificación (queda PENDING) y el admin
//               aprueba o rechaza desde la cola en /admin/verificaciones.
const KEY = "verification_mode"
export type VerificationMode = "quick" | "manual"
export const DEFAULT_VERIFICATION_MODE: VerificationMode = "quick"

export async function getVerificationMode(): Promise<VerificationMode> {
  try {
    const s = await prisma.systemSetting.findUnique({ where: { key: KEY } })
    return s?.value === "manual" ? "manual" : "quick"
  } catch {
    return DEFAULT_VERIFICATION_MODE
  }
}

export async function setVerificationMode(mode: VerificationMode): Promise<VerificationMode> {
  const value = mode === "manual" ? "manual" : "quick"
  await prisma.systemSetting.upsert({
    where: { key: KEY },
    update: { value, isSecret: false },
    create: { key: KEY, value, isSecret: false, description: "Método de verificación de negocios (quick | manual)" },
  })
  return value
}
