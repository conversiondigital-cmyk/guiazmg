import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const now = new Date()
    const fourteenDaysAgo = new Date(now)
    fourteenDaysAgo.setDate(now.getDate() - 13)
    fourteenDaysAgo.setHours(0, 0, 0, 0)

    const [
      totalUsers,
      activeBusinesses,
      activeMarketplace,
      totalLeads,
      completedPayments,
      totalSearches,
      dailyUsers,
      dailyBusinesses,
      dailyLeads,
      dailyMarketplace,
      dailySearches,
      topBusinesses,
      categoryStats,
      neighborhoodStats,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.profile.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.marketplaceListing.count({ where: { status: "ACTIVE", deletedAt: null } }),
      prisma.lead.count(),
      prisma.payment.count({ where: { status: "APPROVED" } }),
      prisma.searchLog.count(),
      prisma.$queryRaw<{ date: Date; count: number }[]>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM users
        WHERE created_at >= ${fourteenDaysAgo} AND deleted_at IS NULL
        GROUP BY DATE(created_at) ORDER BY date
      `,
      prisma.$queryRaw<{ date: Date; count: number }[]>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM businesses
        WHERE created_at >= ${fourteenDaysAgo} AND deleted_at IS NULL
        GROUP BY DATE(created_at) ORDER BY date
      `,
      prisma.$queryRaw<{ date: Date; count: number }[]>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM leads
        WHERE created_at >= ${fourteenDaysAgo}
        GROUP BY DATE(created_at) ORDER BY date
      `,
      prisma.$queryRaw<{ date: Date; count: number }[]>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM marketplace_listings
        WHERE created_at >= ${fourteenDaysAgo} AND deleted_at IS NULL
        GROUP BY DATE(created_at) ORDER BY date
      `,
      prisma.$queryRaw<{ date: Date; count: number }[]>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM search_logs
        WHERE created_at >= ${fourteenDaysAgo}
        GROUP BY DATE(created_at) ORDER BY date
      `,
      prisma.$queryRaw<{
        id: string; name: string; slug: string; views: number; leads: number; category: string | null
      }[]>`
        SELECT
          b.id, b.name, b.slug,
          COALESCE(SUM(bad.views), 0)::int as views,
          COALESCE(l.leads, 0)::int as leads,
          c.name as category
        FROM businesses b
        LEFT JOIN business_analytics_daily bad ON bad.business_id = b.id
        LEFT JOIN categories c ON c.id = b.category_id
        LEFT JOIN (SELECT business_id, COUNT(*)::int as leads FROM leads GROUP BY business_id) l ON l.business_id = b.id
        WHERE b.deleted_at IS NULL
        GROUP BY b.id, b.name, b.slug, c.name, l.leads
        ORDER BY views DESC
        LIMIT 20
      `,
      prisma.$queryRaw<{
        name: string; slug: string; businessCount: number; totalViews: number
      }[]>`
        SELECT
          c.name, c.slug,
          COUNT(b.id)::int as "businessCount",
          COALESCE(SUM(bad.views), 0)::int as "totalViews"
        FROM categories c
        LEFT JOIN businesses b ON b.category_id = c.id AND b.deleted_at IS NULL AND b.status = 'ACTIVE'
        LEFT JOIN business_analytics_daily bad ON bad.business_id = b.id
        WHERE c.isActive = true
        GROUP BY c.id, c.name, c.slug
        ORDER BY "businessCount" DESC
        LIMIT 20
      `,
      prisma.$queryRaw<{
        name: string; slug: string; municipality: string; businessCount: number
      }[]>`
        SELECT
          n.name, n.slug, m.name as municipality,
          COUNT(b.id)::int as "businessCount"
        FROM neighborhoods n
        JOIN municipalities m ON m.id = n.municipality_id
        LEFT JOIN businesses b ON b.neighborhood_id = n.id AND b.deleted_at IS NULL AND b.status = 'ACTIVE'
        WHERE n.isActive = true
        GROUP BY n.id, n.name, n.slug, m.name
        ORDER BY "businessCount" DESC
        LIMIT 20
      `,
    ])

    return NextResponse.json({
      kpis: {
        totalUsers,
        activeBusinesses,
        activeMarketplace,
        totalLeads,
        completedPayments,
        totalSearches,
      },
      daily: {
        users: dailyUsers,
        businesses: dailyBusinesses,
        leads: dailyLeads,
        marketplace: dailyMarketplace,
        searches: dailySearches,
      },
      topBusinesses,
      categoryStats,
      neighborhoodStats,
    })
  } catch (error) {
    console.error("[ADMIN_ANALYTICS_GET]", error)
    return NextResponse.json({ error: "Error al obtener analytics" }, { status: 500 })
  }
}
