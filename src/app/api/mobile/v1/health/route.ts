// Health check público del namespace móvil. Sin auth, sin BD: solo confirma
// que el servicio responde (uso: monitoreo externo / smoke test de la app al
// arrancar antes de intentar nada más pesado).
import { ok } from "@/lib/api/mobile/respond"

export async function GET() {
  return ok({
    service: "guiazmg-mobile-api",
    version: "v1",
    timestamp: new Date().toISOString(),
  })
}
