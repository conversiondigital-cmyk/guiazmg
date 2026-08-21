// Configuración remota de la app móvil. Es la PALANCA DE EMERGENCIA: se
// construye desde B0 (y no después) porque es lo único que permite reaccionar
// a una versión con bug grave una vez que ya hay apps instaladas en la calle
// (activar `forceUpdate`, subir `minAppVersion`, o prender `maintenanceMode`
// sin tener que esperar una nueva versión en las tiendas).
//
// Público (no requiere sesión): la app lo consulta ANTES de loguear a nadie,
// al arrancar. Los valores viven en `SystemSetting` (el panel de admin ya
// tiene UI para editar esa tabla) con defaults sensatos si la clave no existe
// todavía, para que el endpoint nunca truene por falta de configuración.
import { getSetting, getSettingBool } from "@/lib/settings"
import { ok } from "@/lib/api/mobile/respond"

const DEFAULT_MIN_APP_VERSION = "1.0.0"
const DEFAULT_LATEST_APP_VERSION = "1.0.0"

function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_URL || "https://guiazmg.com"
}

export async function GET() {
  const [minAppVersion, latestAppVersion, forceUpdate, maintenanceMode] = await Promise.all([
    getSetting("mobile_min_app_version"),
    getSetting("mobile_latest_app_version"),
    getSettingBool("mobile_force_update"),
    getSettingBool("mobile_maintenance_mode"),
  ])

  const baseUrl = getBaseUrl()

  const response = ok({
    minAppVersion: minAppVersion || DEFAULT_MIN_APP_VERSION,
    latestAppVersion: latestAppVersion || DEFAULT_LATEST_APP_VERSION,
    forceUpdate,
    maintenanceMode,
    // Todo apagado por default: ninguna feature nueva se prende sola con solo
    // desplegar el backend; se enciende a propósito desde `SystemSetting`.
    featureFlags: {
      payments: false,
    },
    // URLs que la app abre en un WebView en vez de reimplementar la pantalla
    // nativa (contenido legal/editorial que cambia seguido y no vale la pena
    // empaquetar en el binario).
    webViewUrls: {
      blog: `${baseUrl}/blog`,
      terms: `${baseUrl}/terminos`,
      privacy: `${baseUrl}/privacidad`,
      dashboard: `${baseUrl}/dashboard`,
      checkout: `${baseUrl}/checkout`,
    },
  })

  // s-maxage=60: un CDN/proxy en frente puede cachear 1 minuto; stale-while-
  // revalidate=300: mientras revalida, sigue sirviendo la versión previa hasta
  // 5 minutos en vez de bloquear al cliente esperando la respuesta fresca.
  response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300")
  return response
}
