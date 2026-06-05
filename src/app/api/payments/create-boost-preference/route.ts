import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { buildPreferencePayload, createPreference } from "@/lib/mercadopago"

async function assertBusinessOwnership(userId: string, businessId: string) {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, ownerId: true, deletedAt: true },
  })

  return !!business && !business.deletedAt && business.ownerId === userId
}

async function assertListingOwnership(businessId: string, listingId: string) {
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

    const { boostDefinitionId, businessId, listingId } = await request.json()

    if (!boostDefinitionId || !businessId) {
      return NextResponse.json({ error: "Datos de boost inválidos" }, { status: 400 })
    }

    const boostDef = await prisma.boostDefinition.findUnique({
      where: { id: boostDefinitionId },
    })

    if (!boostDef || !boostDef.isActive) {
      return NextResponse.json({ error: "Tipo de boost inválido o inactivo" }, { status: 400 })
    }

    const allowed = await assertBusinessOwnership(session.user.id, businessId)
    if (!allowed) {
      return NextResponse.json({ error: "No autorizado para este negocio" }, { status: 403 })
    }

    if (listingId) {
      const listingAllowed = await assertListingOwnership(businessId, listingId)
      if (!listingAllowed) {
        return NextResponse.json({ error: "El anuncio no pertenece al negocio" }, { status: 403 })
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
    })

    const response = await createPreference(payload)

    return NextResponse.json({ initPoint: response.init_point, paymentId: response.id })
  } catch (error) {
    console.error("Error creating boost preference:", error)
    return NextResponse.json({ error: "Error al crear el boost" }, { status: 500 })
  }
}
