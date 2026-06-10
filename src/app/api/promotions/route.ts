import { NextResponse } from "next/server"
import { withApiMiddleware } from "@/lib/security/api-middleware"
import { prisma } from "@/lib/prisma"

export const POST = withApiMiddleware(
  async (req, { session }) => {
    const body = await req.json()
    const { title, description, code, startDate, endDate } = body

    if (!title || !code) {
      return NextResponse.json({ error: "Título y código son requeridos" }, { status: 400 })
    }

    const business = await prisma.profile.findFirst({
      where: { ownerId: (session.user as any).id, deletedAt: null },
    })

    if (!business) {
      return NextResponse.json({ error: "No tienes un negocio registrado" }, { status: 400 })
    }

    const coupon = await prisma.coupon.create({
      data: {
        businessId: business.id,
        code: code.toUpperCase(),
        title,
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        isActive: true,
      },
    })

    return NextResponse.json({ coupon })
  },
  { requireAuth: true, rateLimit: { windowMs: 60000, maxRequests: 30 } }
)

export const GET = withApiMiddleware(
  async (_req, { session }) => {
    const isAdmin = session.user.role === "ADMIN"
    const business = isAdmin
      ? null
      : await prisma.profile.findFirst({
          where: { ownerId: session.user.id, deletedAt: null },
          select: { id: true },
        })

    const coupons = await prisma.coupon.findMany({
      where: isAdmin ? undefined : { businessId: business?.id || "__none__" },
      include: { profile: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    })
    return NextResponse.json({ coupons })
  },
  { requireAuth: true, rateLimit: { windowMs: 60000, maxRequests: 60 } }
)
