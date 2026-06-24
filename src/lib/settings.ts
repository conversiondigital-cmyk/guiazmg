import { prisma } from "@/lib/prisma"

// Lee un valor de configuración: primero lo que el admin pegó en el panel
// (SystemSetting), y si está vacío cae a una variable de entorno. Así, configurar
// una integración desde Admin → Configuración "simplemente funciona" sin redeploy.
export async function getSetting(key: string, envFallback?: string): Promise<string> {
  try {
    const s = await prisma.systemSetting.findUnique({ where: { key } })
    const v = s?.value?.trim()
    if (v) return v
  } catch {
    // BD no disponible: cae al env
  }
  const env = envFallback ? process.env[envFallback] : undefined
  return env?.trim() || ""
}

// Variante booleana ("true" / "1" / "on" => true).
export async function getSettingBool(key: string, envFallback?: string): Promise<boolean> {
  const v = (await getSetting(key, envFallback)).toLowerCase()
  return v === "true" || v === "1" || v === "on"
}
