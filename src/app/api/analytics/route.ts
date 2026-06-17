import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { logAnalyticsEvent } from "@/lib/analytics/events"
import type { AnalyticsEventType } from "@/lib/analytics/events"
import { z } from "zod"

const rateLimitMap = new Map<string, number>()

const OLD_TO_NEW: Record<string, AnalyticsEventType> = {
  view: "BUSINESS_VIEW",
  whatsapp: "WHATSAPP_CLICK",
  phone: "PHONE_CLICK",
  website: "WEBSITE_CLICK",
  maps: "MAP_CLICK",
  facebook: "FACEBOOK_CLICK",
  instagram: "INSTAGRAM_CLICK",
  tiktok: "TIKTOK_CLICK",
}

const eventSchema = z.object({
  eventType: z.enum([
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
  ]).optional(),
  type: z.string().optional(),
  businessId: z.string().cuid().optional(),
  listingId: z.string().cuid().optional(),
  marketplaceListingId: z.string().cuid().optional(),
  userId: z.string().cuid().optional(),
  metadata: z
    .object({
      source: z.string().max(64).optional(),
      query: z.string().max(200).optional(),
      municipality: z.string().max(120).optional(),
      neighborhood: z.string().max(120).optional(),
      resultsCount: z.number().int().nonnegative().max(1000).optional(),
    })
    .passthrough()
    .optional(),
  query: z.string().max(200).optional(),
  municipality: z.string().max(120).optional(),
  neighborhood: z.string().max(120).optional(),
  resultsCount: z.coerce.number().int().nonnegative().max(1000).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = eventSchema.parse(await request.json())
    const session = await auth()
    const { eventType, businessId, type, listingId, marketplaceListingId, metadata, query, municipality, neighborhood, resultsCount } = body

    const resolvedEventType = eventType ?? (type ? OLD_TO_NEW[type] : undefined)

    const resolvedUserId = session?.user?.id ?? undefined

    if (!resolvedEventType) {
      return NextResponse.json({ error: "Invalid event type" }, { status: 400 })
    }

    const ip = request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown"
    // Incluye la entidad: así una vista al negocio A no bloquea la del negocio B
    // dentro de la misma ventana, pero sí deduplica doble-disparos al mismo.
    const entityId = businessId ?? listingId ?? marketplaceListingId ?? ""
    const rateKey = `${ip}:${resolvedEventType}:${entityId}`
    const now = Date.now()
    const last = rateLimitMap.get(rateKey)
    if (last && now - last < 5000) {
      return NextResponse.json({ ok: true, rateLimited: true })
    }
    rateLimitMap.set(rateKey, now)
    if (rateLimitMap.size > 10000) {
      const keysToDelete: string[] = []
      for (const [k, t] of rateLimitMap) {
        if (now - t > 30000) keysToDelete.push(k)
      }
      keysToDelete.forEach((k) => rateLimitMap.delete(k))
    }

    await logAnalyticsEvent({
      eventType: resolvedEventType,
      businessId,
      listingId,
      marketplaceListingId,
      userId: resolvedUserId,
      metadata: {
        ...metadata,
        query,
        municipality,
        neighborhood,
        resultsCount,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") ?? undefined,
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
  }
}
