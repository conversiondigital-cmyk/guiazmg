import { prisma } from "@/lib/prisma"

// API key de Google Maps (la define el admin en Configuración → Google Maps).
// Es una key de cliente (se usa en el navegador); restríngela por dominio en GCP.
export async function getGoogleMapsApiKey(): Promise<string> {
  try {
    const s = await prisma.systemSetting.findUnique({ where: { key: "google_maps_api_key" } })
    return s?.value?.trim() || ""
  } catch {
    return ""
  }
}
