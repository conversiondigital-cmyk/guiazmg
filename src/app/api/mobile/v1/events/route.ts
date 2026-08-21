// Telemetría de la app en LOTE: la app acumula eventos localmente (vistas,
// clics en WhatsApp/teléfono, favoritos…) y los manda en batch para no hacer
// un round-trip por cada toque. Auth OPCIONAL: un usuario anónimo también
// "llama" o "ve" un negocio, y ese dato igual alimenta las estadísticas que
// los negocios pagan por ver en /dashboard/estadisticas.
//
// `metadata.source` se fuerza SIEMPRE a "mobile" (sin importar lo que mande el
// cliente) para poder segmentar tráfico web vs. app en el dashboard sin romper
// el histórico existente, que asume "web"/vacío cuando no hay `source`.
export const dynamic = "force-dynamic"

import { NextRequest } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { logAnalyticsEvent, type AnalyticsEventType } from "@/lib/analytics/events"
import { getClientIp } from "@/lib/security/request-rate-limit"
import { ok, fail } from "@/lib/api/mobile/respond"

const MAX_BATCH = 50

// SEGURIDAD (fix inflado de estadísticas): el dashboard de estadísticas es un
// producto PAGADO; sin control, cualquiera (auth opcional) podía mandar lotes de
// 50 WHATSAPP_CLICK/LEAD_GENERATED para un negocio AJENO sin límite y corromper
// las métricas o generar leads falsos. El endpoint web (src/app/api/analytics)
// ya deduplica por (ip,evento,entidad) en ventana de 5s; aquí se replica esa
// defensa por-evento dentro del lote. Eventos duplicados se descartan en
// silencio (se cuentan como "aceptados" para no filtrar el umbral al cliente).
const eventThrottleMap = new Map<string, number>()
const THROTTLE_WINDOW_MS = 5000

function throttled(ip: string, eventType: string, entityId: string): boolean {
  const key = `${ip}:${eventType}:${entityId}`
  const now = Date.now()
  const last = eventThrottleMap.get(key)
  if (last && now - last < THROTTLE_WINDOW_MS) return true
  eventThrottleMap.set(key, now)
  if (eventThrottleMap.size > 20000) {
    for (const [k, t] of eventThrottleMap) {
      if (now - t > 30000) eventThrottleMap.delete(k)
    }
  }
  return false
}

// Mismo catálogo de tipos que acepta `src/app/api/analytics/route.ts` (la
// fuente de verdad de qué mueve una métrica real en el dashboard del negocio).
const EVENT_TYPES = [
  "BUSINESS_VIEW",
  "LISTING_VIEW",
  "MARKETPLACE_VIEW",
  "WHATSAPP_CLICK",
  "PHONE_CLICK",
  "WEBSITE_CLICK",
  "MAP_CLICK",
  "WAZE_CLICK",
  "FACEBOOK_CLICK",
  "INSTAGRAM_CLICK",
  "TIKTOK_CLICK",
  "LEAD_GENERATED",
  "SEARCH_EXECUTED",
  "FAVORITE_ADDED",
  "REVIEW_CREATED",
  "BOOST_PURCHASED",
  "MEMBERSHIP_PURCHASED",
  "COUPON_REDEEMED",
] as const

const eventItemSchema = z.object({
  eventType: z.enum(EVENT_TYPES),
  businessId: z.string().cuid().optional(),
  listingId: z.string().cuid().optional(),
  marketplaceListingId: z.string().cuid().optional(),
  occurredAt: z.string().datetime().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

const batchSchema = z.object({
  events: z.array(eventItemSchema).min(1).max(MAX_BATCH),
})

export async function POST(request: NextRequest) {
  let body: z.infer<typeof batchSchema>
  try {
    body = batchSchema.parse(await request.json())
  } catch (error) {
    const details = error instanceof z.ZodError ? error.flatten() : undefined
    return fail("VALIDATION_ERROR", 400, "Lote de eventos inválido (máximo 50, eventType requerido).", details)
  }

  const session = await auth().catch(() => null)
  const userId = session?.user?.id
  const ip = getClientIp(request)
  const userAgent = request.headers.get("user-agent") ?? undefined

  let accepted = 0
  for (const event of body.events) {
    const entityId = event.businessId ?? event.listingId ?? event.marketplaceListingId ?? ""
    if (throttled(ip, event.eventType, entityId)) {
      // Duplicado dentro de la ventana anti-abuso: se ignora para no inflar
      // métricas, pero cuenta como aceptado (el cliente no debe reintentar).
      accepted += 1
      continue
    }
    try {
      await logAnalyticsEvent({
        eventType: event.eventType as AnalyticsEventType,
        businessId: event.businessId,
        listingId: event.listingId,
        marketplaceListingId: event.marketplaceListingId,
        userId,
        metadata: {
          ...event.metadata,
          // Fuerza el origen SIEMPRE a "mobile": no confiar en lo que mande el
          // cliente evita que un cliente viejo/hostil se disfrace de web.
          source: "mobile",
          ipAddress: ip,
          userAgent,
        },
      })
      accepted += 1
    } catch (error) {
      // Un evento suelto que falla no debe tumbar el resto del lote.
      console.error("[mobile/events]", error instanceof Error ? error.message : error)
    }
  }

  return ok({ accepted })
}
