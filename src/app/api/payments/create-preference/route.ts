import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildPreferencePayload, createPreference } from "@/lib/mercadopago"
import { MEMBERSHIP_PLANS } from "@/lib/constants"

async function assertBusinessOwnership(userId: string, businessId: string, isAdmin: boolean) {
  if (isAdmin) return true

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true, deletedAt: true },
  })

  return !!business && !business.deletedAt && business.ownerId === userId
}

async function assertListingOwnership(businessId: string, listingId: string, isAdmin: boolean) {
  if (isAdmin) return true

  const listing = await prisma.listing.findFirst({
    where: { id: listingId, businessId, deletedAt: null },
    select: { id: true },
  })

  return !!listing
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { type, plan, businessId, boostDefinitionId, listingId, couponCode } = await request.json()
    const isAdmin = session.user.role === "ADMIN"

    let coupon: {
      code: string
      discountType: "PERCENTAGE" | "FIXED"
      discountValue: number
      minAmount: number | null
      startsAt: Date | null
      expiresAt: Date | null
    } | undefined

    if (couponCode) {
      const found = await prisma.promotionCoupon.findUnique({
        where: { code: couponCode },
      })

      if (!found) {
        return NextResponse.json({ error: "Cupón inválido" }, { status: 400 })
      }

      if (!found.isActive) {
        return NextResponse.json({ error: "Cupón inactivo" }, { status: 400 })
      }

      if (found.expiresAt && found.expiresAt < new Date()) {
        return NextResponse.json({ error: "Cupón expirado" }, { status: 400 })
      }

      if (found.maxUses !== null && found.usedCount >= found.maxUses) {
        return NextResponse.json({ error: "Cupón agotado" }, { status: 400 })
      }

        coupon = {
          code: found.code,
          discountType: found.discountType as "PERCENTAGE" | "FIXED",
          discountValue: Number(found.discountValue),
          minAmount: found.minAmount ? Number(found.minAmount) : null,
          startsAt: found.startsAt,
          expiresAt: found.expiresAt,
        }
      }

    if (type === "membership") {
      if (!plan || !MEMBERSHIP_PLANS[plan as keyof typeof MEMBERSHIP_PLANS]) {
        return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
      }

      if (!businessId) {
        return NextResponse.json({ error: "Negocio requerido" }, { status: 400 })
      }

      const allowed = await assertBusinessOwnership(session.user.id, businessId, isAdmin)
      if (!allowed) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }

      const membershipPlan = MEMBERSHIP_PLANS[plan as keyof typeof MEMBERSHIP_PLANS]
      if (coupon) {
        const amount = membershipPlan.price
        if (coupon.startsAt && coupon.startsAt > new Date()) {
          return NextResponse.json({ error: "Cupón aún no vigente" }, { status: 400 })
        }
        if (coupon.minAmount !== null && amount < coupon.minAmount) {
          return NextResponse.json({ error: "Cupón no aplica para este monto" }, { status: 400 })
        }
      }
      const payload = buildPreferencePayload({
        title: `Plan ${membershipPlan.name} - Guía ZMG`,
        quantity: 1,
        unitPrice: membershipPlan.price,
        externalReference: `membership:${plan}:${session.user.id}:${businessId || ""}`,
        coupon,
      })

      const response = await createPreference(payload)

      return NextResponse.json({ initPoint: response.init_point, paymentId: response.id })
    }

    if (type === "boost") {
      if (!boostDefinitionId || !businessId) {
        return NextResponse.json({ error: "Datos de boost inválidos" }, { status: 400 })
      }

      const allowed = await assertBusinessOwnership(session.user.id, businessId, isAdmin)
      if (!allowed) {
        return NextResponse.json({ error: "No autorizado" }, { status: 403 })
      }

      if (listingId) {
        const listingAllowed = await assertListingOwnership(businessId, listingId, isAdmin)
        if (!listingAllowed) {
          return NextResponse.json({ error: "El anuncio no pertenece al negocio" }, { status: 403 })
        }
      }

      const boostDef = await prisma.boostDefinition.findUnique({
        where: { id: boostDefinitionId },
      })

      if (!boostDef || !boostDef.isActive) {
        return NextResponse.json({ error: "Tipo de boost inválido" }, { status: 400 })
      }

      if (coupon) {
        const amount = Number(boostDef.price)
        if (coupon.startsAt && coupon.startsAt > new Date()) {
          return NextResponse.json({ error: "Cupón aún no vigente" }, { status: 400 })
        }
        if (coupon.minAmount !== null && amount < coupon.minAmount) {
          return NextResponse.json({ error: "Cupón no aplica para este monto" }, { status: 400 })
        }
      }

      const ref = listingId
        ? `boost:${boostDefinitionId}:${businessId}:${session.user.id}:${listingId}`
        : `boost:${boostDefinitionId}:${businessId}:${session.user.id}`

      const payload = buildPreferencePayload({
        title: `Boost ${boostDef.name} - Guía ZMG`,
        quantity: 1,
        unitPrice: Number(boostDef.price),
        externalReference: ref,
        coupon,
      })

      const response = await createPreference(payload)

      return NextResponse.json({ initPoint: response.init_point, paymentId: response.id })
    }

    return NextResponse.json({ error: "Tipo de pago inválido" }, { status: 400 })
  } catch (error) {
    console.error("Error creating preference:", error)
    return NextResponse.json({ error: "Error al crear el pago" }, { status: 500 })
  }
}
