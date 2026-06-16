import { prisma } from "@/lib/prisma"
import { Prisma } from "@/generated/prisma/client"
import { createNotification } from "@/lib/notifications/create"

export type AnalyticsEventType =
  | "BUSINESS_VIEW"
  | "LISTING_VIEW"
  | "MARKETPLACE_VIEW"
  | "WHATSAPP_CLICK"
  | "PHONE_CLICK"
  | "WEBSITE_CLICK"
  | "MAP_CLICK"
  | "WAZE_CLICK"
  | "FACEBOOK_CLICK"
  | "INSTAGRAM_CLICK"
  | "TIKTOK_CLICK"
  | "LEAD_GENERATED"
  | "SEARCH_EXECUTED"
  | "FAVORITE_ADDED"
  | "REVIEW_CREATED"
  | "BOOST_PURCHASED"
  | "MEMBERSHIP_PURCHASED"
  | "COUPON_REDEEMED"

type AnalyticsMetadata = {
  source?: string
  userAgent?: string
  ipAddress?: string
  query?: string
  municipality?: string
  neighborhood?: string
  resultsCount?: number
}

const bizAnalyticsFieldMap: Record<string, keyof Prisma.ProfileAnalyticsDailyCreateInput> = {
  BUSINESS_VIEW: "views",
  LISTING_VIEW: "listingViews",
  WHATSAPP_CLICK: "whatsappClicks",
  PHONE_CLICK: "phoneClicks",
  WEBSITE_CLICK: "websiteClicks",
  MAP_CLICK: "mapClicks",
  WAZE_CLICK: "wazeClicks",
  FACEBOOK_CLICK: "facebookClicks",
  INSTAGRAM_CLICK: "instagramClicks",
  TIKTOK_CLICK: "tiktokClicks",
}

function getToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

export async function logAnalyticsEvent(params: {
  eventType: AnalyticsEventType
  businessId?: string
  listingId?: string
  marketplaceListingId?: string
  userId?: string
  metadata?: AnalyticsMetadata
}) {
  try {
    const { eventType, businessId, listingId, userId, metadata } = params
    const today = getToday()

    if (businessId && eventType in bizAnalyticsFieldMap) {
      const field = bizAnalyticsFieldMap[eventType] as string
      try {
        await prisma.profileAnalyticsDaily.upsert({
          where: { businessId_date: { businessId, date: today } },
          update: { [field]: { increment: 1 } },
          create: { businessId, date: today, [field]: 1 },
        })
      } catch (error) {
        console.error("[analytics] profileAnalyticsDaily upsert failed:", error)
      }
    }

    if (eventType === "LEAD_GENERATED" && businessId) {
      try {
        await prisma.lead.create({
          data: {
            businessId,
            userId: userId ?? null,
            listingId: listingId ?? null,
            type: "FORM_SUBMIT",
            source: (metadata?.source ?? "DIRECT") as never,
            status: "NEW",
          },
        })
        await prisma.leadEvent.create({
          data: {
            businessId,
            listingId: listingId ?? null,
            eventType: "LEAD_GENERATED",
            userAgent: metadata?.userAgent ?? null,
            ipAddress: metadata?.ipAddress ?? null,
          },
        })

        const profile = await prisma.profile.findUnique({
          where: { id: businessId },
          select: { ownerId: true, name: true },
        })
        if (profile && profile.ownerId !== userId) {
          await createNotification({
            userId: profile.ownerId,
            type: "MESSAGE",
            title: `Nuevo lead en ${profile.name}`,
            message: "Un cliente mostró interés en tu negocio.",
          })
        }
      } catch (error) {
        console.error("[analytics] LEAD_GENERATED persistence failed:", error)
      }
    }

    if (eventType === "SEARCH_EXECUTED") {
      try {
        await prisma.searchLog.create({
          data: {
            query: metadata?.query ?? "",
            municipality: metadata?.municipality ?? null,
            neighborhood: metadata?.neighborhood ?? null,
            userId: userId ?? null,
            resultsCount: metadata?.resultsCount ?? 0,
          },
        })
      } catch (error) {
        console.error("[analytics] SEARCH_EXECUTED log failed:", error)
      }
    }
  } catch (error) {
    console.error("[analytics] logAnalyticsEvent failed:", error)
  }
}

export async function getDailyAnalytics(options: {
  businessId?: string
  startDate: Date
  endDate: Date
}) {
  try {
    const where: any = {
      date: { gte: options.startDate, lte: options.endDate },
    }
    if (options.businessId) where.businessId = options.businessId

    const rows = await prisma.profileAnalyticsDaily.findMany({
      where,
      orderBy: { date: "asc" },
    })
    return rows
  } catch (error) {
    console.error("[analytics] getDailyAnalytics failed:", error)
    return []
  }
}
